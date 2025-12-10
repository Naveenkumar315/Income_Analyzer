import { useState, useCallback, useEffect, useRef } from "react";
import { Form, Input } from "antd";
import "antd/dist/reset.css";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import toast from "react-hot-toast";
import { setTokens } from "../utils/authService";
import { useApp } from "../contexts/AppContext";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [emailExists, setEmailExists] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const debounceTimerRef = useRef(null);
    const { user, setUser } = useApp();

    const onFinish = useCallback(async (values) => {
        debugger
        setLoading(true);
        try {
            // Call login API
            setUser(() => ({
                email: values.email
            }))
            const response = await authApi.login({
                email: values.email,
                password: values.password
            });

            // Check user status - only 'active' users can login
            if (response.status === "pending") {
                toast.error("Your account is pending approval. Please wait for admin approval.");
                setLoading(false);
                return;
            }

            if (response.status === "inactive") {
                toast.error("Your account has been deactivated. Please contact support.");
                setLoading(false);
                return;
            }

            if (response.status !== "active") {
                toast.error("Unable to login. Please contact support.");
                setLoading(false);
                return;
            }
            if (response?.is_first_time_user) {
                return navigate("/update-password");
            }

            // Save tokens to session storage
            setTokens(response.access_token, response.refresh_token, {
                email: response.email,
                role: response.role,
                user_id: response.user_id
            });

            toast.success("Login successful!");
            navigate("/home");
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage = error.response?.data?.detail || "Invalid email or password";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleFieldsChange = useCallback(() => {
        const values = form.getFieldsValue();
        const email = values.email?.trim() || "";
        const password = values.password?.trim() || "";
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If email is valid, debounce the API call
        if (isValidEmail) {
            setCheckingEmail(true);
            debounceTimerRef.current = setTimeout(async () => {
                try {
                    const response = await authApi.checkEmailExists(email);
                    setEmailExists(response.exists);
                    // Form is valid only if email exists and password is entered
                    setIsFormValid(response.exists && password.length > 0);
                } catch (error) {
                    console.error("Error checking email:", error);
                    setEmailExists(false);
                    setIsFormValid(false);
                } finally {
                    setCheckingEmail(false);
                }
            }, 500); // 500ms debounce delay
        } else {
            setIsFormValid(false);
            setEmailExists(false);
            setCheckingEmail(false);
        }

        // Immediate validation for password changes when email is already validated
        if (isValidEmail && emailExists && password.length > 0) {
            setIsFormValid(true);
        } else if (isValidEmail && emailExists && password.length === 0) {
            setIsFormValid(false);
        }
    }, [form, emailExists]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleNavigate = useCallback(() => {
        navigate('/signup');
    }, [navigate]);

    const handleNavigateForgot = useCallback(() => {
        navigate('/forgot-password')
    }, [navigate])

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover  bg-no-repeat"
            style={{
                backgroundImage: `url('/auth_page_bg.png')`,
            }}
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
                        <span className="text-sky-500 text-xl font-extrabold font-creato uppercase leading-7 ml-1">
                            Analyzer
                        </span>
                    </div>
                </div>


                {/* headings */}
                <div className="text-center">
                    <div className="justify-start text-Colors-Text-Base-base text-2xl font-bold custom-font-jura leading-8">
                        Log In
                    </div>

                    <div className="text-base-lightest-custom mt-2 text-sm font-creato leading-4">
                        Please log in to continue
                    </div>
                </div>

                {/* form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFieldsChange={handleFieldsChange}
                    requiredMark={false}
                    className="mt-5"
                >
                    {/* EMAIL */}
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

                    {/* Email validation feedback */}
                    {!checkingEmail && form.getFieldValue('email') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.getFieldValue('email')) && !emailExists && (
                        <div className="text-red-500 text-xs mt-[-16px] mb-4">
                            Email is not registered
                        </div>
                    )}

                    {/* PASSWORD */}
                    <FormField
                        type="password"
                        label="Password"
                        name="password"
                        placeholder="Enter Password"
                        rules={[{ required: true, message: "Please enter password" }]}
                    />



                    {/* Forgot password */}
                    <div className="text-Colors-Text-Primary-primary text-sm font-medium font-creato leading-4 cursor-pointer mb-6" onClick={handleNavigateForgot}>
                        Forgot password?
                    </div>

                    {/* Login button with dynamic variant + icon */}
                    <CustomButton
                        variant={isFormValid ? "primary" : "disabled"}
                        type="submit"
                        className="mt-0"
                        disabled={!isFormValid || loading || checkingEmail}
                    >
                        {loading ? "Logging in..." : "Login"}
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

                    {/* Sign Up */}
                    <div className="mt-4 flex justify-center items-center text-sm font-creato leading-4">
                        <span className="text-base-lightest-custom">
                            Don't have an account?
                        </span>
                        <span className="ml-1 text-Colors-Text-Primary-primary font-medium cursor-pointer" onClick={handleNavigate}>
                            Sign Up
                        </span>
                    </div>
                </Form>
            </div>

            {/* bottom logo */}
            <img
                src="/loandna_logo.png"
                alt="Brand Logo"
                className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
            />
        </div>
    );
}
