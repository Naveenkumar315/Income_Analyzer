import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Form } from "antd";
import "antd/dist/reset.css";

import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authApi from "../api/authApi";

const EmailVerificationPage = ({ email, onVerify, setStep, SIGNUP_STEPS }) => {
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
    const [resendAttempts, setResendAttempts] = useState(0);

    const RESEND_COOLDOWN_SECONDS = 60; // change as needed
    const MAX_RESEND_ATTEMPTS = 5;

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

    // countdown effect for cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => {
            setResendCooldown((s) => {
                if (s <= 1) {
                    clearInterval(t);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    const handleResend = async () => {
        if (!email) {
            toast.error("No email available to resend.");
            return;
        }
        if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
            toast.error("Max resend attempts reached. Please try again later.");
            return;
        }
        if (resendCooldown > 0) {
            toast.info(`Please wait ${resendCooldown}s before resending.`);
            return;
        }

        try {
            setResendLoading(true);
            // start cooldown immediately (optimistic UX)
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            toast.info("Resending OTP...");

            // call API — wait to confirm success/failure
            await authApi.sendVerificationCode(email);

            setResendAttempts((a) => a + 1);
            toast.success("OTP resent successfully!");
        } catch (err) {
            // cancel cooldown so user can retry quickly (optional)
            setResendCooldown(0);
            console.error("Resend failed:", err);
            toast.error("Failed to resend OTP. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    // VERIFY FUNCTION
    const handleVerifyCode = async () => {
        debugger
        const code = form.getFieldValue("verificationCode")?.trim();

        if (!code) {
            toast.error("Please enter the verification code.");
            return;
        }

        try {
            setLoading(true);

            // Call backend verify API
            const res = await authApi.verifyCode(email, code);

            if (res) {
                toast.success("OTP verified successfully!");
                setStep(SIGNUP_STEPS.TERMS_CONDITION)
            }

            // Move to next step (Terms & Conditions or whatever you want)
            if (onVerify) {
                onVerify(code);
            }

        } catch (error) {
            console.error("Verify error:", error);

            const message =
                error?.response?.data?.detail || "Invalid or expired OTP. Please try again.";

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };


    const onFinish = useCallback(
        (values) => {
            setLoading(true);
            console.log("Verify Code:", values);
            setTimeout(() => {
                setLoading(false);
                if (onVerify) onVerify(values.verificationCode);
            }, 800);
        },
        [onVerify]
    );

    const handleFieldsChange = useCallback(() => {
        const values = form.getFieldsValue();
        const code = values.verificationCode?.trim() || "";
        const isValidCode = /^[0-9]{6}$/.test(code);
        setIsFormValid(isValidCode);
    }, [form]);

    const handleBackToSignup = useCallback(() => {
        navigate("/signup");
        setStep(SIGNUP_STEPS.EMAIL)
    }, [navigate]);

    return (
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
            <div className="relative z-10 w-[360px] rounded-xl bg-white px-8 py-8 shadow-md">
                {/* logo */}
                <div className="mb-4 flex items-center justify-center gap-2 w-full">
                    <img src="/dna-strand.svg" alt="" className="h-6 w-6" />
                    <div className="flex items-center">
                        <span className="text-gray-800 text-xl font-extrabold font-creato uppercase leading-7">
                            Income
                        </span>
                        <span className="text-sky-500 text-xl font-extrabold font-creato uppercase leading-7 ">
                            Analyzer
                        </span>
                    </div>
                </div>

                {/* headings */}
                <div className="text-center">
                    <div className="text-Colors-Text-Base-base text-2xl font-bold custom-font-jura leading-8">
                        Email Verification
                    </div>

                    <div className="text-base-lightest-custom mt-2 text-sm font-creato leading-4">
                        Verification code sent to {email || "your email"}
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
                            type="otp"
                            label="Verification Code"
                            name="verificationCode"
                            placeholder="Enter verification code"
                            maxLength={6}
                            rules={[
                                { required: true, message: "Please enter verification code" },
                                { pattern: /^[0-9]{6}$/, message: "Verification code must be exactly 6 digits" },
                            ]}
                        />
                        <div className="mt-5">
                            <CustomButton
                                variant={isFormValid ? "primary" : "disabled"}
                                type="button"
                                disabled={!isFormValid || loading}
                                onClick={handleVerifyCode}
                            >
                                Verify
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

                        <div className="mt-4">
                            <CustomButton
                                variant="outline"
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading || resendCooldown > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS}
                            >
                                Resend Code
                            </CustomButton>
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={handleBackToSignup}
                                className="text-Colors-Text-Primary-primary text-sm font-creato font-medium leading-4"
                            >
                                Back to Signup
                            </button>
                        </div>
                    </Form>
                </div>
            </div>

            <img
                src="/loandna_logo.png"
                alt="Brand Logo"
                className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
            />
        </div>
    );
};

export default React.memo(EmailVerificationPage);
