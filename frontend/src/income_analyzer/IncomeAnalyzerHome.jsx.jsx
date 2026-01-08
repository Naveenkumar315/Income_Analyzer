import { useState, useRef, useCallback, useEffect } from "react";
import LoanIdPage from "./LoanID"
import UploadDocumentsModal from "./UploadDocumentsModal"
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
import ProcessingLoaderModal from "./ProcessingLoaderModal";
import LoanDocumentScreen from "./LoanDocumentScreen";
import AnalysisResultsTabs from "./AnalysisResultsTabs";
import axiosClient from "../api/axiosClient";
import AnalysisLoaderModal from "./AnalysisLoaderModal";

const IncomeAnalyzerHome = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loanId, setLoanId] = useState(null);
    const [files, setFiles] = useState({});
    const [results, setResults] = useState({});
    const [showModal, setShowModal] = useState({ upload: false, loader: false });

    // New state for analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedData, setAnalyzedData] = useState({});
    const [borrowerList, setBorrowerList] = useState([]);
    const [selectedBorrower, setSelectedBorrower] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const controllerRef = useRef(null);

    useEffect(() => {
        console.log('analyzedData', analyzedData);

    }, [analyzedData])

    const uploadAndCleanJSON = async (file, loanId, username, email) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    let rawJson;
                    try {
                        rawJson = JSON.parse(e.target.result);
                    } catch (err) {
                        return reject(new Error("Invalid JSON file"));
                    }

                    const payload = {
                        username: username || "",
                        email: email || "",
                        loanID: loanId,
                        file_name: file.name,
                        raw_json: rawJson,
                        threshold: 0.7,
                        borrower_indicators: ["borrower name", "employee name"],
                        employer_indicators: ["employer", "company"],
                    };

                    const res = await authApi.cleanJson(payload);

                    resolve(res?.cleaned_json);
                } catch (err) {
                    reject(err);
                }
            };

            reader.readAsText(file?.originFileObj || file);
        });
    };

    const handleUpload = async (file) => {
        try {
            const cleaned = await uploadAndCleanJSON(
                file,
                loanId,
                sessionStorage.getItem("user_name"),
                sessionStorage.getItem("user_email")
            )

            setFiles({ cleaned_data: cleaned })

            // Extract borrower list
            const borrowers = Object.keys(cleaned);
            setBorrowerList(borrowers);
            setSelectedBorrower(borrowers[0] || null);

            toast.success("File processed successfully");
            console.log("Normalized JSON:", cleaned);

            setShowModal({ upload: false, loader: false });
            setCurrentStep(4);
        } catch (err) {
            console.error(err);
            toast.error("Upload failed");
            setShowModal({ upload: false, loader: false });
            setCurrentStep(2);
        }
    };

    const handleContinueLoanID = async (loanId) => {
        try {
            const params = {
                loanID: loanId,
                email: sessionStorage.getItem("user_email"),
            };
            const response = await authApi.checkLoanId(params);
            if (response?.exists) {
                toast.error("This Loan ID already exists for this user.");
                return;
            }
            sessionStorage.setItem("loanId", loanId)
            toast.success("Loan ID is available. You can proceed.");
            setLoanId(loanId);
            setCurrentStep(2);
            setShowModal({ upload: true, loader: false });
        } catch (error) {
            console.error("Loan ID check failed:", error);
            toast.error("Unable to verify Loan ID. Please try again.");
        }
    };

    // Analysis functions
    const updateAnalyzedDataIntoDB = useCallback(
        async (email, loanId, rulesData, incomeSummary, summaryData, insightsComment, borrower, bank_Statement, self_employee, reo_summary) => {
            try {
                await axiosClient.post("/store-analyzed-data", {
                    email,
                    loanID: loanId,
                    borrower,
                    analyzed_data: {
                        rules: rulesData,
                        summary: summaryData,
                        income_summary: incomeSummary,
                        insights: insightsComment,
                        bankStatement: bank_Statement,
                        self_employee: self_employee,
                        reo_summary: reo_summary || [],
                    },
                });
                console.log(`✅ analyzed_data stored successfully for ${borrower}`);
            } catch (err) {
                console.error(`❌ failed to store analyzed_data for ${borrower}`, err);
            }
        },
        []
    );

    const analyzeBorrower = useCallback(
        async (borrower, email, loanId, signal, bank_Statement, isBackground = false) => {
            console.log(`▶️ ${isBackground ? "Background" : "Starting"} analysis for: ${borrower}`);
            let step = 0;

            const updateProgress = () => {
                if (!isBackground) {
                    step += 1;
                    setLoadingStep(step);
                }
            };

            try {
                // Step 1: Verify Rules
                const rulesRes = await axiosClient.post("/verify-rules", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
                console.log('rulesRes', rulesRes);

                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 2: Income Calculation
                const incomeRes = await axiosClient.post("/income-calc", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
                console.log('incomeRes', incomeRes);

                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 3: Income Insights
                const insightsRes = await axiosClient.post("/income-insights", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
                console.log('insightsRes', insightsRes);
                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 4: Self-employed data
                const incomeself_emp = await axiosClient.post("/income-self_emp", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
                console.log('incomeself_emp', incomeself_emp);
                if (signal.aborted) throw new Error("Aborted");
                const self_employee_response = incomeself_emp?.income || {};
                updateProgress();

                // Step 5: REO (with error handling for 404)
                let reo_summary = [];
                try {
                    const reo_res = await axiosClient.post("/reo-calc", null, {
                        params: { email, loanID: loanId, borrower },
                        signal,
                    });
                    reo_summary = reo_res?.data?.reo_calc?.checks || [];
                } catch (reoError) {
                    // Handle 404 or other REO errors gracefully
                    if (reoError?.response?.status === 404) {
                        console.warn(` REO endpoint not available for ${borrower}, skipping...`);
                    } else {
                        console.error(` REO calculation error for ${borrower}:`, reoError);
                    }
                    // Continue with empty REO data
                    reo_summary = [];
                }
                updateProgress();

                const incomeSummary = incomeRes?.income?.[0]?.checks?.reduce(
                    (acc, item) => ({ ...acc, [item.field]: item.value }),
                    {}
                ) || {};
                const summaryData = incomeRes?.income?.[0]?.checks || [];
                const insightsComment = insightsRes?.income_insights?.insight_commentry || "";

                const finalReport = {
                    rules: rulesRes,
                    summary: summaryData,
                    income_summary: incomeSummary,
                    insights: insightsComment,
                    bankStatement: bank_Statement,
                    self_employee: self_employee_response,
                    reo_summary: reo_summary,
                };

                console.log('finalReport', finalReport);


                // Update state immediately
                setAnalyzedData((prev) => ({ ...prev, [borrower]: finalReport }));

                console.log(`✅ Finished analysis for: ${borrower}`);

                // Save to DB
                await updateAnalyzedDataIntoDB(
                    email,
                    loanId,
                    finalReport.rules,
                    finalReport.income_summary,
                    finalReport.summary,
                    finalReport.insights,
                    borrower,
                    finalReport.bankStatement,
                    finalReport.self_employee,
                    reo_summary,
                );

                return finalReport;
            } catch (ex) {
                if (ex.message === "Aborted") {
                    console.warn(`🛑 Analysis aborted for ${borrower}`);
                } else if (!signal.aborted) {
                    console.error(`❌ Error analyzing borrower ${borrower}`, ex);
                    toast.error(`Failed to analyze ${borrower}`);
                }
                return null;
            }
        },
        [updateAnalyzedDataIntoDB]
    );

    const handleStartAnalysis = useCallback(async () => {
        if (borrowerList.length === 0) {
            toast.error("No borrowers found to analyze");
            return;
        }

        setIsAnalyzing(true);
        setLoadingStep(0);
        setCurrentStep(5);

        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        const email = sessionStorage.getItem("user_email") || "";
        const loanId = sessionStorage.getItem("loanId") || "";

        try {
            const bankStatementRes = await axiosClient.post("/banksatement-insights", null, {
                params: { email, loanID: loanId },
                signal,
            });

            const bank_Statement =
                bankStatementRes?.data?.income_insights?.insight_commentry || [];

            // ---- FIRST BORROWER (foreground + loader) ----
            const firstBorrower = borrowerList[0];

            await analyzeBorrower(firstBorrower, email, loanId, signal, bank_Statement, false);

            // instantly show in UI
            setSelectedBorrower(firstBorrower);

            // ---- REMAINING BORROWERS (background) ----
            const remainingBorrowers = borrowerList.slice(1);

            for (const borrower of remainingBorrowers) {
                await analyzeBorrower(
                    borrower,
                    email,
                    loanId,
                    signal,
                    bank_Statement,
                    true
                );
            }

            console.log("All borrowers processed");
        } catch (err) {
            if (!signal.aborted) {
                toast.error("Analysis failed");
            }
        } finally {
            setIsAnalyzing(false);
        }
    }, [borrowerList, analyzeBorrower]);


    const handleCancelAnalysis = useCallback(() => {
        console.log("🛑 Canceling analysis...");
        controllerRef.current?.abort();
        setIsAnalyzing(false);
        setLoadingStep(0);
        setCurrentStep(4);
    }, []);

    return (
        <>
            {currentStep === 1 && (
                <LoanIdPage onNext={handleContinueLoanID} />
            )}

            <UploadDocumentsModal
                open={showModal.upload}
                onUpload={handleUpload}
                onCancel={() => {
                    setShowModal({ upload: false, loader: false });
                    setCurrentStep(1);
                }}
            />

            {/* <ProcessingLoaderModal
                open={isAnalyzing}
                totalSteps={5}
                currentStep={loadingStep}
                onStop={handleCancelAnalysis}
            /> */}

            {currentStep === 4 && (
                <LoanDocumentScreen
                    files={files}
                    analyzedData={analyzedData}
                    setFiles={setFiles}
                    setCurrentStep={setCurrentStep}
                    currentStep={currentStep}
                    onStartAnalysis={handleStartAnalysis}
                />
            )}

            {currentStep === 5 && (
                <AnalysisResultsTabs
                    setCurrentStep={setCurrentStep}
                    currentStep={currentStep}
                    borrowerList={borrowerList}
                    selectedBorrower={selectedBorrower}
                    setSelectedBorrower={setSelectedBorrower}
                    analyzedData={analyzedData}
                    isLoading={isAnalyzing}
                />
            )}

            <AnalysisLoaderModal
                open={isAnalyzing}
                currentStep={loadingStep}
                totalSteps={5}
                borrowerName={borrowerList[0]}
                onStop={handleCancelAnalysis}
                stepLabels={[
                    "Verifying Rules",
                    "Calculating Income",
                    "Generating Insights",
                    "Processing Self-Employment Data",
                    // "Analyzing REO Data"
                ]}
            />
        </>
    );
}

export default IncomeAnalyzerHome;