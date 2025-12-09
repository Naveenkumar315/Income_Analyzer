import React, { useState, useCallback, useMemo, startTransition } from "react";
import { Form } from "antd";
import "antd/dist/reset.css";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import EmailVerificationPage from "./EmailVerificationPage";
import TermsConditionPage from "./TermsConditionPage";
import SignupRequestSubmittedPage from "./SignupRequestSubmittedPage";
import CompanyDetailsPage from "./CompanyDetailsPage";
import authApi from "../api/authApi";
import { toast } from "react-toastify";


export const SIGNUP_STEPS = Object.freeze({
    EMAIL: "email",
    VERIFICATION_CODE: "verification_code",
    TERMS_CONDITION: "terms_condition",
    COMPANY_DETAILS: "company_details",
    SIGNUP_REQUEST: "signup_request",
});

function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [step, setStep] = useState(SIGNUP_STEPS.EMAIL);
    const [userEmail, setUserEmail] = useState(""); // Store user's email
    const [emailExists, setEmailExists] = useState(false); // Track if email already exists
    const [checkingEmail, setCheckingEmail] = useState(false); // Track email check loading state

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

    const onFinish = useCallback(
        (values) => {
            setLoading(true);
            console.log("Sign Up:", values);
            // Store the email for use in verification page
            // setUserEmail(values.email);
            // TODO: call API here
            setLoading(false);
            // setStep(SIGNUP_STEPS.VERIFICATION_CODE);
        },
        []
    );

    const handleFieldsChange = useCallback(async () => {
        const values = form.getFieldsValue();
        const email = values.email?.trim() || "";
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        setUserEmail(email);

        if (isValidEmail) {
            setCheckingEmail(true);
            try {
                const response = await authApi.checkEmailExists(email);
                // Note: axiosClient already unwraps response.data, so we access response.exists directly
                setEmailExists(response.exists);
                setIsFormValid(!response.exists);
            } catch (error) {
                console.error("Error checking email:", error);
                setEmailExists(false);
                setIsFormValid(false);
            } finally {
                setCheckingEmail(false);
            }
        } else {
            setEmailExists(false);
            setIsFormValid(false);
        }
    }, [form]);

    const handleNavigate = useCallback(() => {
        navigate("/");
    }, [navigate]);

    const handleVerify = useCallback(() => {
        // setStep(SIGNUP_STEPS.TERMS_CONDITION);
    }, []);

    const handleSendEmail = useCallback(async () => {
        if (!userEmail) return;

        try {
            setLoading(true);

            // TESTING MODE: Skip email verification and go directly to terms & conditions
            // console.log("⚠️ EMAIL VERIFICATION DISABLED FOR TESTING");
            // toast.info("Skipping email verification for testing");
            // startTransition(() => setStep(SIGNUP_STEPS.TERMS_CONDITION));

            // //ORIGINAL CODE - Uncomment to re-enable email verification
            // Show verification screen immediately(optimistic)
            startTransition(() => setStep(SIGNUP_STEPS.VERIFICATION_CODE));

            // Fire-and-forget the API call so the UI is instant.
            // Still handle success/error to show toasts, but don't block UI.
            authApi.sendVerificationCode(userEmail)
                .then(res => {
                    console.log("OTP queued/sent:", res);
                    toast.success("OTP sent successfully!");
                    // optionally show success toast if you want
                })
                .catch(err => {
                    console.error("Failed to send verification code:", err);
                    // show an error toast and optionally move back to signup or let user retry
                    // e.g. showToast("Failed to send code. Please retry.");
                })
                .finally(() => {
                    // stop any spinner if you used one for the send
                });
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            // Keep loading off because we already moved on
            setLoading(false);
        }
    }, [userEmail, setStep]);

    const handleTermsCondition = useCallback(() => {
        setStep(SIGNUP_STEPS.COMPANY_DETAILS);
    }, []);

    const handleSubmit = useCallback(() => {
        setStep(SIGNUP_STEPS.SIGNUP_REQUEST);
    }, [])

    return (
        <>
            {step === SIGNUP_STEPS.EMAIL && (
                <div
                    className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-no-repeat"
                    style={bgStyle}
                >
                    {/* white curve */}
                    <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" />

                    {/* background circles */}
                    <div className="pointer-events-none absolute -left-40 -top-24 h-96 w-96 rounded-full bg-white/15" />
                    <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-white/15" />

                    {/* card */}
                    <div className="relative z-10 w-[384px]  rounded-xl bg-white px-8 py-8 shadow-md">
                        {/* logo */}
                        <div className="mb-4 flex items-center justify-center gap-2 w-full">
                            <img src="/dna-strand.svg" alt="" className="h-6 w-6" />

                            <div className="flex items-center">
                                <span className="text-gray-800 text-xl font-extrabold font-creato uppercase leading-7">
                                    Income
                                </span>
                                <span className="text-sky-500 text-xl font-extrabold font-creato uppercase leading-7 ml-1">
                                    Analyzer
                                </span>
                            </div>
                        </div>

                        {/* headings */}
                        <div className="text-center">
                            <div className="text-Colors-Text-Base-base text-2xl font-bold custom-font-jura leading-8">
                                Sign Up
                            </div>

                            <div className="text-base-lightest-custom mt-4 text-sm font-creato leading-4">
                                Welcome! Let&apos;s set things up
                            </div>
                        </div>

                        {/* form */}
                        <div className="mt-4">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                onFieldsChange={handleFieldsChange}
                                requiredMark={false}
                                className="mt-5"
                            >
                                <FormField
                                    type="text"
                                    label="Email Address"
                                    name="email"
                                    placeholder="Enter your email"
                                    rules={[
                                        { required: true, message: "Please enter your email" },
                                        { type: "email", message: "Please enter a valid email" },
                                    ]}
                                />

                                {emailExists && (
                                    <div className="text-red-500 text-sm mt-1 -mt-4 mb-2">
                                        This email is already registered.
                                    </div>
                                )}

                                {checkingEmail && (
                                    <div className="text-gray-500 text-sm mt-1 -mt-4 mb-2">
                                        Checking email availability...
                                    </div>
                                )}

                                <div className="mt-6">
                                    <CustomButton
                                        variant={isFormValid ? "primary" : "disabled"}
                                        type="button"
                                        disabled={!isFormValid || emailExists || checkingEmail || loading}
                                        onClick={handleSendEmail}
                                    >
                                        Send Verification Code
                                        <img
                                            src={
                                                isFormValid
                                                    ? "/arrow-right-active.png"
                                                    : "/arrow-right.svg"
                                            }
                                            alt=""
                                            className="w-4 h-4"
                                        />
                                    </CustomButton>
                                </div>

                                <div className="mt-4 flex justify-center items-center text-sm font-creato leading-4">
                                    <span className="text-base-lightest-custom">
                                        Already have an account?
                                    </span>
                                    <span
                                        className="ml-1 text-Colors-Text-Primary-primary font-medium cursor-pointer"
                                        onClick={handleNavigate}
                                    >
                                        Sign In
                                    </span>
                                </div>
                            </Form>
                        </div>
                    </div>

                    {/* bottom logo */}
                    <img
                        src="/loandna_logo.png"
                        alt="Brand Logo"
                        className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
                    />
                </div>
            )}

            {step === SIGNUP_STEPS.VERIFICATION_CODE && (
                <EmailVerificationPage email={userEmail} onVerify={handleVerify} setStep={setStep} SIGNUP_STEPS={SIGNUP_STEPS} />
            )}

            {step === SIGNUP_STEPS.TERMS_CONDITION && (
                <TermsConditionPage onAccesptTerms={handleTermsCondition} />
            )}

            {step === SIGNUP_STEPS.COMPANY_DETAILS && (
                <CompanyDetailsPage
                    onClose={() => setStep(SIGNUP_STEPS.SIGNUP_REQUEST)}
                    onSubmit={handleSubmit}
                    userEmail={userEmail}
                />
            )}


            {step === SIGNUP_STEPS.SIGNUP_REQUEST && <SignupRequestSubmittedPage />}
        </>
    );
}

export default React.memo(SignupPage);
