import React, { useState, useCallback, useMemo } from "react";
import { Form } from "antd";
import "antd/dist/reset.css";

import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";

const EmailVerificationPage = ({ onVerify }) => {
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

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
        const isValidCode = code.length > 0;
        setIsFormValid(isValidCode);
    }, [form]);

    const handleBackToSignup = useCallback(() => {
        navigate("/signup");
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
            <div className="relative z-10 w-[360px] rounded-xl bg-white px-8 py-8 shadow-2xl">
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
                        Email Verification
                    </div>

                    <div className="text-base-lightest-custom mt-2 text-sm font-creato leading-4">
                        Verification code sent to test.mail@ca.com
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
                            label="Verification Code"
                            name="verificationCode"
                            placeholder="Enter verification code"
                            rules={[
                                { required: true, message: "Please enter verification code" },
                            ]}
                        />

                        <div className="mt-5">
                            <CustomButton
                                variant={isFormValid ? "primary" : "disabled"}
                                type="submit"
                                disabled={!isFormValid || loading}
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
                                onClick={() => console.log("Resend Code")}
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
