import { useCallback, useState } from "react";
import { Form } from "antd";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
import { LockOutlined } from "@ant-design/icons";
import { useApp } from "../contexts/AppContext";

const UpdatePasswordPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { user, setUser } = useApp();

    // Password rules checks
    const [pwdChecks, setPwdChecks] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
    });

    const checkPasswordRules = (pwd = "") => ({
        length: pwd.length >= 12,
        lowercase: /[a-z]/.test(pwd),
        uppercase: /[A-Z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[!@#$%^&*(),.?":{}|]/.test(pwd),
    });

    const handleValuesChange = (_changed, allValues) => {
        const pwd = allValues?.newPassword || "";
        setPwdChecks(checkPasswordRules(pwd));
    };

    const allRulesSatisfied = Object.values(pwdChecks).every(Boolean);

    const handleUpdatePassword = useCallback(async () => {
        debugger

        console.log('user', user);

        // return
        const { newPassword, confirmPassword } = form.getFieldsValue();

        if (!newPassword || !confirmPassword) {
            return toast.error("Please fill all fields.");
        }

        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match.");
        }

        if (!allRulesSatisfied) {
            return toast.error("Password does not meet the rules.");
        }

        setLoading(true);
        try {
            const obj = {
                email: user.email,
                password: newPassword,
                verificationCode: "",
                "verifycode": false
            }
            await authApi.updatePassword?.(obj);
            toast.success("Password updated successfully. Please login.");
            navigate("/");
        } catch (err) {
            console.error(err);
            const message = err?.response?.data?.detail || "Unable to update password.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [form, navigate, allRulesSatisfied]);

    const passwordsMatch =
        form.getFieldValue("newPassword") &&
        form.getFieldValue("confirmPassword") &&
        form.getFieldValue("newPassword") === form.getFieldValue("confirmPassword");

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('/auth_page_bg.png')` }}
        >
            {/* <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" /> */}
            <div className="relative z-10 bg-white rounded-xl shadow-md w-[90%] max-w-[420px] md:w-[384px] md:h-[500px] px-6 py-6 md:px-8 md:py-8">

                {/* Logo */}
                <div className="mb-4 flex items-center justify-center gap-2 w-full">
                    <img src="/dna-strand.svg" alt="" className="h-6 w-6" />
                    <div className="flex items-center">
                        <span className="text-gray-800 text-xl font-extrabold uppercase font-creato leading-8">
                            INCOME
                        </span>
                        <span className="text-sky-500 text-xl font-extrabold uppercase font-creato leading-8 ml-1">
                            ANALYZER
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold leading-8 mb-1 custom-font-jura">
                        Update Password
                    </h2>
                    <p className="text-xs md:text-sm text-gray-400 font-creato">
                        Set a strong password for your account.
                    </p>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onValuesChange={handleValuesChange}
                >
                    <FormField
                        type="password"
                        label="New Password"
                        name="newPassword"
                        placeholder="Enter new password"
                        prefix={<LockOutlined />}
                        rules={[{ required: true, message: "Please enter new password" }]}
                    />

                    <FormField
                        type="password"
                        label="Confirm Password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        prefix={<LockOutlined />}
                         rules={[
                      {
                        required: true,
                        message: "Please confirm new password",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            !value ||
                            getFieldValue("newPassword") === value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match")
                          );
                        },
                      }),
                    ]}
                    />

                    {/* 🔥 EXACT UI STYLE from Forgot Password */}
                    {/* <div className="mb-3 text-[12px] leading-[13px] text-gray-600 font-creato mt-3">
                        <div className={pwdChecks.length ? "text-green-600" : ""}>
                            • Minimum 12 characters
                        </div>
                        <div className={pwdChecks.lowercase ? "text-green-600" : ""}>
                            • At least 1 lowercase letter
                        </div>
                        <div className={pwdChecks.uppercase ? "text-green-600" : ""}>
                            • At least 1 uppercase letter
                        </div>
                        <div className={pwdChecks.number ? "text-green-600" : ""}>
                            • At least 1 number
                        </div>
                        <div className={pwdChecks.special ? "text-green-600" : ""}>
                            • At least 1 special character from [!@#$%^&*(),.?":{ }|]
                        </div>
                    </div> */}

                    <div className="mt-2 text-[12px] leading-[16px] font-creato">
                        <span className={pwdChecks.lowercase ? "text-[#119d0c]" : "text-gray-600"}>
                            At least one lowercase
                        </span>
                        {", "}

                        <span className={pwdChecks.uppercase ? "text-[#119d0c]" : "text-gray-600"}>
                            one uppercase
                        </span>
                        {", "}

                        <span className={pwdChecks.number ? "text-[#119d0c]" : "text-gray-600"}>
                            one number
                        </span>
                        {","}
                        <br />

                        <span className={pwdChecks.special ? "text-[#119d0c]" : "text-gray-600"}>
                            one special character – [!@#$%^&*(),.?":{ }|]
                        </span>
                        {", "}

                        <span className={pwdChecks.length ? "text-[#119d0c]" : "text-gray-600"}>
                            Minimum 12 characters
                        </span>
                        </div>


                    <div className="mt-3">
                        <CustomButton
                            variant= {loading || !allRulesSatisfied || !passwordsMatch ? "disabled" : "primary"}
                            type="button"
                            disabled={loading || !allRulesSatisfied || !passwordsMatch}
                            onClick={handleUpdatePassword}
                            // className="w-full rounded-lg py-3 flex items-center justify-center gap-3 text-white text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed"'
                            className={`mt-0 ${loading || !allRulesSatisfied || !passwordsMatch ? "!cursor-not-allowed" : "cursor-pointer"}`}   
                        >
                            {loading ? "Updating..." : "Update Password"}
                             <img
                            src={
                                 loading || !allRulesSatisfied || !passwordsMatch
                                    ? "/arrow-right.svg"
                                    : "/arrow-right-active.png"
                            }
                            alt=""
                            className="w-4 h-4"
                        />
                        </CustomButton>
                    </div>

                    <div className="mt-3 text-Colors-Text-Primary-primary text-center cursor-pointer font-creato">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-sm font-medium hover:underline font-creato cursor-pointer"
                        >
                            Back to Log In
                        </button>
                    </div>
                </Form>
            </div>

            <img
                src="/loandna_logo.png"
                alt="Logo"
                className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
            />
        </div>
    );
};

export default UpdatePasswordPage;
