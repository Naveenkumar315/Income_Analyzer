import { useState, useCallback, useEffect, useRef } from "react";
import { Form, Input } from "antd";
import "antd/dist/reset.css";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
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
        setLoading(true);
        try {
            const email = (values.email || "").trim();
            const password = (values.password || "").trim();

            // We intentionally DO NOT block submit just because email may not exist.
            // Let server respond with clear error and show toast.

            setUser(() => ({
                email: values.email
            }));

            const response = await authApi.login({
                email,
                password
            });

            // success path
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
                setLoading(false);
                return navigate("/update-password");
            }

            // Save tokens and continue
            setTokens(response.access_token, response.refresh_token, {
                email: response.email,
                role: response.role,
                user_id: response.user_id,
                username: response.username
            });

            toast.success("Login successful!");
            navigate("/home");
        } catch (error) {
            console.error("Login error:", error);

            // Show toast message for wrong credentials / not registered email
            // Prefer server-provided message if available.
            const serverMsg = error?.response?.data?.detail;
            if (serverMsg) {
                toast.error(serverMsg);
            } else {
                // fallback message
                toast.error("Invalid email or password");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, setUser]);

    // ---------- UPDATED: compute form-validity locally (no waiting on server) ----------
    const handleFieldsChange = useCallback(() => {
        const values = form.getFieldsValue();
        const email = values.email?.trim() || "";
        const password = values.password?.trim() || "";
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        // Immediately enable button when both fields are filled and email format valid
        setIsFormValid(isValidEmail && password.length > 0);

        // ---------- COMMENTED OUT: debounced server-side email existence check ----------
        // if you want to keep server-side check while typing, re-enable this block.
        // if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        // if (isValidEmail) {
        //   setCheckingEmail(true);
        //   debounceTimerRef.current = setTimeout(async () => {
        //     try {
        //       const response = await authApi.checkEmailExists(email);
        //       setEmailExists(response.exists);
        //     } catch (e) {
        //       setEmailExists(false);
        //     } finally {
        //       setCheckingEmail(false);
        //     }
        //   }, 500);
        // } else {
        //   setEmailExists(false);
        //   setCheckingEmail(false);
        // }
        // -------------------------------------------------------------------------------

    }, [form]); // no emailExists dependency so it updates immediately when typing
    // -------------------------------------------------------------------------------------

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
            className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `url('/auth_page_bg.png')`,
            }}
        >
            {/* white curve */}
            {/* <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" /> */}

            {/* background circles */}
            {/* <div className="pointer-events-none absolute -left-40 -top-24 h-96 w-96 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-white/15" /> */}

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
                    hasFeedback={false}
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

                    {/* (Inline "Email not registered" removed — we handle via toast on submit) */}

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
                        // keep cursor change so user sees not-allowed when button is disabled
                        className={`mt-0 ${isFormValid ? "cursor-pointer" : "!cursor-not-allowed"}`}
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
