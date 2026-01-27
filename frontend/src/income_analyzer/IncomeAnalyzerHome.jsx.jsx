import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    const [bankStatement, setBankStatement] = useState(null);
    const [selectedBorrower, setSelectedBorrower] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [hasModifications, setHasModifications] = useState(false);

    // NEW: Track which borrowers are currently being processed
    const [processingBorrowers, setProcessingBorrowers] = useState(new Set());

    const controllerRef = useRef(null);

    const { loanId: routeLoanId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('analyzedData', analyzedData);
    }, [analyzedData])

    //  SINGLE function to fetch loan data
    const fetchLoanForView = useCallback(
        async (targetLoanId) => {
            try {
                const response = await axiosClient.post("/view-loan", {
                    email: sessionStorage.getItem("user_email") || "",
                    loanId: targetLoanId,
                });

                const data = response;

                if (!data || !Object.keys(data).length) {
                    toast.error("Loan data not found");
                    return false;
                }

                // Update state
                setFiles({ cleaned_data: data.cleaned_data });
                setAnalyzedData(data.analyzed_data);
                setHasModifications(data.hasModifications || false);

                const borrowers = Object.keys(data.cleaned_data || {});
                setBorrowerList(borrowers);
                setSelectedBorrower(borrowers[0] || null);

                return true;
            } catch (err) {
                console.error("view-loan failed", err);
                toast.error("Failed to load analysis results");
                return false;
            }
        },
        []
    );

    //  SINGLE useEffect - loads to step 4 (LoanDocumentScreen)
    useEffect(() => {
        if (!routeLoanId) return;

        const loadFromRoute = async () => {
            const success = await fetchLoanForView(routeLoanId);
            if (success) {
                setLoanId(routeLoanId);
                sessionStorage.setItem("loanId", routeLoanId);
                setCurrentStep(4); // Always load to document screen first
            }
        };

        loadFromRoute();
    }, [routeLoanId, fetchLoanForView]);

    // Update borrower list whenever files.cleaned_data changes
    useEffect(() => {
        if (files?.cleaned_data) {
            const borrowers = Object.keys(files.cleaned_data);
            setBorrowerList(borrowers);

            // Update selected borrower if current one no longer exists
            if (!selectedBorrower || !borrowers.includes(selectedBorrower)) {
                setSelectedBorrower(borrowers[0] || null);
            }
        }
    }, [files?.cleaned_data, selectedBorrower]);

    const uploadAndCleanJSON = async (file, loanId, username, email) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const text = e.target.result.trim();

                    // Empty file case
                    if (!text) {
                        return reject(new Error("EMPTY_JSON"));
                    }

                    let rawJson;
                    try {
                        rawJson = JSON.parse(text);
                    } catch {
                        return reject(new Error("INVALID_JSON"));
                    }

                    // {} or [] case
                    const isEmpty =
                        (Array.isArray(rawJson) && rawJson.length === 0) ||
                        (typeof rawJson === "object" && !Array.isArray(rawJson) && Object.keys(rawJson).length === 0);

                    if (isEmpty) {
                        return reject(new Error("EMPTY_JSON"));
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


            reader.readAsText(file);
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
            // borrowerList will be updated by useEffect

            toast.success("File processed successfully");
            console.log("Normalized JSON:", cleaned);

            setShowModal({ upload: false, loader: false });
            setCurrentStep(4);
        } catch (err) {
            console.error(err);
            if (err.message === "EMPTY_JSON") {
                toast.error("Uploaded file is empty. Please upload a valid JSON file.");
            }
            else if (err.message === "INVALID_JSON") {
                toast.error("Invalid JSON file. Please upload a valid .json file.");
            }
            else {
                toast.error("Upload failed. Please try again.");
            }
            // toast.error("Upload failed");
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

    const fetchBankStatement = useCallback(
        async (email, loanId, signal) => {
            try {
                const res = await axiosClient.post(
                    "/banksatement-insights",
                    null,
                    { params: { email, loanID: loanId }, signal }
                );

                const statement = res?.income_insights?.insight_commentry || [];

                setBankStatement(statement);
                return statement;
            } catch (err) {
                console.error("❌ Bank statement fetch failed", err);
                setBankStatement([]);
                return [];
            }
        },
        []
    );

    const analyzeBorrower = useCallback(
        async (borrower, email, loanId, signal, bank_Statement, isBackground = false) => {
            console.log(`${isBackground ? "🔄 Background" : "▶️ Starting"} analysis for: ${borrower}`);
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

                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 2: Income Calculation
                const incomeRes = await axiosClient.post("/income-calc", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });

                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 3: Income Insights
                const insightsRes = await axiosClient.post("/income-insights", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
                if (signal.aborted) throw new Error("Aborted");
                updateProgress();

                // Step 4: Self-employed data
                const incomeself_emp = await axiosClient.post("/income-self_emp", null, {
                    params: { email, loanID: loanId, borrower },
                    signal,
                });
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
                    reo_summary = reo_res?.reo_calc?.checks || [];
                } catch (reoError) {
                    if (reoError?.response?.status === 404) {
                        console.warn(` REO endpoint not available for ${borrower}, skipping...`);
                    } else {
                        console.error(` REO calculation error for ${borrower}:`, reoError);
                    }
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

                // Update state immediately
                setAnalyzedData((prev) => ({ ...prev, [borrower]: finalReport }));

                // Mark borrower as completed
                setProcessingBorrowers((prev) => {
                    const next = new Set(prev);
                    next.delete(borrower);
                    return next;
                });

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
                    console.warn(`⚠️ Analysis aborted for ${borrower}`);
                } else if (!signal.aborted) {
                    console.error(`❌ Error analyzing borrower ${borrower}`, ex);
                    toast.error(`Failed to analyze ${borrower}`);
                }

                // Remove from processing on error
                setProcessingBorrowers((prev) => {
                    const next = new Set(prev);
                    next.delete(borrower);
                    return next;
                });

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

        // Mark all borrowers as processing
        setProcessingBorrowers(new Set(borrowerList));

        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        const email = sessionStorage.getItem("user_email") || "";
        const loanId = sessionStorage.getItem("loanId") || "";

        try {
            // FETCH BANK STATEMENT ONCE PER LOAN
            const bank_Statement = await fetchBankStatement(email, loanId, signal);

            // ---- FIRST BORROWER (with progress UI) ----
            const firstBorrower = borrowerList[0];
            await analyzeBorrower(
                firstBorrower,
                email,
                loanId,
                signal,
                bank_Statement,
                false
            );

            setSelectedBorrower(firstBorrower);

            // Move to results screen after first borrower is done
            setIsAnalyzing(false);
            setCurrentStep(5);

            // ---- REMAINING BORROWERS (background) ----
            if (borrowerList.length > 1) {
                console.log(`\n🔄 Processing ${borrowerList.length - 1} additional borrower(s) in background...`);

                // Process remaining borrowers in background
                (async () => {
                    for (const borrower of borrowerList.slice(1)) {
                        if (signal.aborted) break;

                        console.log(`\n🔄 Analyzing borrower: ${borrower}`);
                        await analyzeBorrower(
                            borrower,
                            email,
                            loanId,
                            signal,
                            bank_Statement,
                            true
                        );
                    }

                    console.log('\n✅ All borrowers analyzed successfully!');
                })();
            }
        } catch (err) {
            if (!signal.aborted) {
                console.error('❌ Analysis failed:', err);
                toast.error("Analysis failed");
            }
            setIsAnalyzing(false);
        }
    }, [borrowerList, analyzeBorrower, fetchBankStatement]);

    const handleCancelAnalysis = useCallback(() => {
        console.log("🛑 Canceling analysis...");
        controllerRef.current?.abort();
        setIsAnalyzing(false);
        setLoadingStep(0);
        setCurrentStep(4);
        setProcessingBorrowers(new Set());
    }, []);

    const fetchLoanForViewAnalyzed = async (targetLoanId) => {
        try {
            const response = await axiosClient.post("/get-analyzed-data", {
                email: sessionStorage.getItem("user_email") || "",
                loanId: targetLoanId,
            });

            const data = response;

            if (!data || !Object.keys(data).length) {
                toast.error("Loan data not found");
                return false;
            }
            setAnalyzedData(data.analyzed_data || {});
            setCurrentStep(5);

            return true;
        } catch (err) {
            console.error("view-loan failed", err);
            toast.error("Failed to load analysis results");
            return false;
        }
    }

    // NEW: Handler to update borrower list when data changes in LoanDocumentScreen
    const handleDataUpdate = useCallback((updatedData) => {
        setFiles({ cleaned_data: updatedData });
        // borrowerList will be updated by the useEffect that watches files.cleaned_data
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

            {currentStep === 4 && (
                <LoanDocumentScreen
                    files={files}
                    analyzedData={analyzedData}
                    setFiles={setFiles}
                    onDataUpdate={handleDataUpdate}
                    setCurrentStep={setCurrentStep}
                    currentStep={currentStep}
                    onStartAnalysis={handleStartAnalysis}
                    setHasModifications={setHasModifications}
                    hasModifications={hasModifications}
                    onViewResults={async () => {
                        const loanIdToView = sessionStorage.getItem("loanId");
                        if (!loanIdToView) {
                            toast.error("Loan ID not found");
                            return false;
                        }

                        return await fetchLoanForViewAnalyzed(loanIdToView);
                    }}
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
                    processingBorrowers={processingBorrowers}
                    isLoading={isAnalyzing}
                    onBackToDashboard={() => navigate("/dashboard")}
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
                    "Calculating REO",
                ]}
            />
        </>
    );
}

export default IncomeAnalyzerHome;