import { useState, useCallback } from "react";
import { Form, Input } from "antd";
import CustomButton from "../components/CustomButton";
import toast from "../utils/ToastService";

export default function LoanIdPage({ onNext }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    const onFinish = useCallback(
        async (values) => {
            try {
                setLoading(true);

                const loanId = values.loanId?.trim();
                if (!loanId) return;

                // notify parent (IncomeAnalyzerHome)
                onNext?.(loanId);

            } catch (err) {
                toast.error("Invalid Loan ID");
            } finally {
                setLoading(false);
            }
        },
        [onNext]
    );

    const handleFieldsChange = async () => {
        const value = form.getFieldValue("loanId")?.trim() || "";


        setIsFormValid(value.length > 0);
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 -translate-y-20">
            <div className="relative z-10 w-[360px] rounded-xl px-8 py-8">

                <div className="text-center mb-2">
                    <div className="text-2xl font-bold custom-font-jura leading-8">
                        Income Analyzer
                    </div>
                    <div className="text-base-lightest-custom mt-1 text-sm font-creato leading-4">
                        Provide Loan ID to begin income analysis
                    </div>
                </div>

                <Form
                    layout="vertical"
                    requiredMark={false}
                    onFinish={onFinish}
                    form={form}
                    onFieldsChange={handleFieldsChange}
                    className="mt-4"
                >
                    <Form.Item
                        label="Loan ID"
                        name="loanId"
                        rules={[
                            { required: true, message: "Please enter Loan ID" },
                        ]}
                    >
                        <Input placeholder="Enter" maxLength={30} />
                    </Form.Item>

                    <CustomButton
                        variant={isFormValid ? "primary" : "disabled"}
                        type="submit"
                        disabled={!isFormValid || loading}
                        className={`mt-1 ${isFormValid ? "cursor-pointer" : "!cursor-not-allowed"}`}
                    >
                        {loading ? "Processing..." : "Continue"}
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
                </Form>
            </div>
        </div>
    );
}
