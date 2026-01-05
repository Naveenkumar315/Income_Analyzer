import { useState } from "react";
import LoanIdPage from "./LoanID"
import UploadDocumentsModal from "./UploadDocumentsModal"
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
import ProcessingLoaderModal from "./ProcessingLoaderModal";
import LoanDocumentScreen from "./LoanDocumentScreen";


const IncomeAnalyzerHome = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loanId, setLoanId] = useState(null);
    const [files, setFiles] = useState({});
    const [results, setResults] = useState(null);
    const [showModal, setShowModal] = useState({ upload: false, loader: false });

    const uploadAndCleanJSON = async (file, loanId, username, email) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    // parse JSON safely
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

            toast.success("File processed successfully");

            // move to results page or store
            console.log("Normalized JSON:", cleaned);

            setShowModal({ upload: false, loader: false });
            setCurrentStep(4); // result screen (your next step)
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
            toast.success("Loan ID is available. You can proceed.");
            setLoanId(loanId);
            setCurrentStep(2);
            setShowModal({ upload: true, loader: false });
        } catch (error) {
            console.error("Loan ID check failed:", error);
            toast.error("Unable to verify Loan ID. Please try again.");
        }
    };

    return (
        <>
            {currentStep === 1 && (
                <LoanIdPage
                    onNext={handleContinueLoanID}
                />
            )}

            <UploadDocumentsModal
                open={showModal.upload}
                onUpload={handleUpload}
                onCancel={() => {
                    setShowModal({ upload: false, loader: false });
                    setCurrentStep(1);
                }}
            />

            <ProcessingLoaderModal
                open={showModal.loader}
                totalSteps={10}
                onStop={() => {
                    setShowModal({ upload: false, loader: false });
                    setCurrentStep(2);
                }}
            />

            {currentStep === 4 && (
                <LoanDocumentScreen files={files} />
            )}
        </>
    );

}


export default IncomeAnalyzerHome
