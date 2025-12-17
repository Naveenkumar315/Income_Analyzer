import { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "antd";
import "antd/dist/reset.css";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
import { LockOutlined } from "@ant-design/icons";

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const debounceTimerRef = useRef(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // "email" | "verify"
  const [email, setEmail] = useState("");
  // const [checkingEmail, setCheckingEmail] = useState(false);
  // const [emailExists, setEmailExists] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);


  // global error array for verify step (unused for toast; shows inline)
  const [fieldErrors, setFieldErrors] = useState([]);

  // password rule checks
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // derived values for button enablement
  const allRulesSatisfied = Object.values(pwdChecks).every(Boolean);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Optional: debounced email existence check
  // const handleEmailChangeAndCheck = useCallback((value) => {
  //   const v = (value || "").trim();
  //   setEmail(v);

  //   if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  //   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  //   if (!isValidEmail) {
  //     setEmailExists(false);
  //     setCheckingEmail(false);
  //     return;
  //   }

  //   setCheckingEmail(true);
  //   debounceTimerRef.current = setTimeout(async () => {
  //     try {
  //       const res = await authApi.checkEmailExists?.(v);
  //       setEmailExists(Boolean(res?.exists));
  //     } catch (err) {
  //       setEmailExists(false);
  //     } finally {
  //       setCheckingEmail(false);
  //     }
  //   }, 450);
  // }, []);

  // send verification code (step 1)
  const handleSendCode = useCallback(
    async (values) => {
      debugger;
      const emailValue = (values?.email || email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        toast.error("Please enter a valid email.");
        return;
      }

      setLoading(true);
      try {
        const response = await authApi.checkEmailExists?.(emailValue)

        if (!response?.exists) {
          toast.error("Please complete the sign-up process first.")
          return
        }
        if (response?.status === "rejected"){
          toast.error("Your signup request has been rejected")
          return
        }
        if (response?.exists && response?.status === "pending") {
          toast.error("Your account is pending admin approval. You’ll be notified once it’s approved.")
          return
        }

        await authApi.sendVerificationCode?.(emailValue);
        toast.success("Verification code sent to your email.");
        setStep("verify");
        setEmail(emailValue);
        form.setFieldsValue({ verificationCode: "" });
        setFieldErrors([]); // clear any previous errors
      } catch (err) {
        console.error("send code error", err);
        const message =
          err?.response?.data?.detail || "Unable to send verification code.";
        toast.error(message); // <-- server error (e.g., "email not registered") shown on button click
      } finally {
        setLoading(false);
      }
    },
    [email, form]
  );

  // helper: check password rules (special chars limited to requested set)
  const checkPasswordRules = (pwd = "") => {
    const length = pwd.length >= 12;
    const lowercase = /[a-z]/.test(pwd);
    const uppercase = /[A-Z]/.test(pwd);
    const number = /[0-9]/.test(pwd);
    // special char set: [!@#$%^&*(),.?":{}|]
    const special = /[!@#$%^&*(),.?":{}|]/.test(pwd);

    return { length, lowercase, uppercase, number, special };
  };

  // update password checks on values change
  const handleFormValuesChange = useCallback(
    (changedValues, allValues) => {
      // only monitor newPassword
      const newPwd = allValues?.newPassword || "";
      setPwdChecks(checkPasswordRules(newPwd));

      // collect field errors for inline block if verify step
      if (step === "verify") {
        const errors = (form.getFieldsError() || [])
          .filter((f) => f.errors && f.errors.length > 0)
          .map((f) => f.errors[0]);
        setFieldErrors(errors);
      } else {
        setFieldErrors([]);
      }
    },
    [form, step]
  );

  // update password (step 2)
  // only toast on password mismatch or server error (e.g., wrong code).
  const handleUpdatePassword = useCallback(
    async (values) => {
      debugger;
      const raw = form.getFieldsValue();

      const confirmPassword = (raw.confirmPassword || "").trim();
      const newPassword = (raw.newPassword || "").trim();
      const verificationCode = (raw.verificationCode || "").trim();

      // Only these toast errors per your scenario:
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      // require code and all rules satisfied; if not satisfied, we silently return (no toast)
      if (!verificationCode || !allRulesSatisfied) {
        // we do not show toast per your instruction; checklist guides the user
        return;
      }

      setLoading(true);
      try {
        const obj = {
          email,
          password: newPassword,
          verificationCode,
          verifycode: true,
        };
        const response = await authApi.updatePassword?.(obj);
        console.log("((((((((((", response);

        toast.success("Password updated. Please login with new password.");
        navigate("/");
      } catch (err) {
        console.error("update password error", err);
        debugger;
        // API error (e.g., wrong code) — show toast
        if (err?.detail) {
          return toast.error(err.detail);
        }
        const message =
          err?.response?.data?.detail || "Unable to update password.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [email, navigate, allRulesSatisfied]
  );

  const handleBackToLogin = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Collect form field errors (we'll show them in one block for verify step)
  // onFieldsChange signature: (changedFields, allFields)
  const handleFormFieldsChange = useCallback(
    (_, allFields) => {
      if (step !== "verify") {
        setFieldErrors([]);
        return;
      }

      const errors = allFields
        .filter((f) => f.errors && f.errors.length > 0)
        .map((f) => f.errors[0]);

      setFieldErrors(errors);
    },
    [step]
  );

  // choose card height depending on step
  const cardHeightClass = step === "email" ? "md:h-[380px]" : "md:h-[570px]";

  // password validation rule (pattern) kept for Form rules (same set)
  const passwordPatternRule = {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|]).{12,}$/,
    message:
      "Password must include lowercase, uppercase, number, special char and be at least 12 characters.",
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.trim();
    setEmail(value);

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setIsEmailValid(isValid);
  };


  // helper render for checklist item
  const ChecklistItem = ({ ok, text }) => {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`w-4 h-4 rounded-sm flex items-center justify-center ${ok
            ? "bg-green-500 text-white"
            : "border border-gray-300 text-gray-400"
            }`}
        >
          {ok ? "✓" : ""}
        </div>
        <div className={`${ok ? "text-green-700" : "text-gray-500"}`}>
          {text}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url('/auth_page_bg.png')` }}
    >
      {/* <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" /> */}

      {/* responsive card */}
      <div
        className={
          "relative z-10 bg-white rounded-xl shadow-md " +
          `w-[90%] max-w-[420px] md:w-[400px] ${cardHeightClass} ` +
          "px-3 py-6 md:px-8 md:py-4 overflow-hidden"
        }
      >
        <div className="w-full flex flex-col" style={{ minHeight: 0 }}>
          <div className="w-full overflow-auto">
            {/* logo */}
            <div className="mb-2 flex items-center justify-center gap-2 w-full">
              <img src="/dna-strand.svg" alt="" className="h-6 w-6" />
              <div className="flex items-center">
                <span className="text-gray-800 text-xl font-extrabold font-creato uppercase leading-7">
                  INCOME
                </span>
                <span className="text-sky-500 text-xl font-extrabold font-creato uppercase leading-7 ml-1">
                  ANALYZER
                </span>
              </div>
            </div>

            {/* headings */}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold custom-font-jura leading-8 mb-1 ">
                {step === "verify" ? "Update Password" : "Forgot Password?"}
              </h2>
              <p className="text-xs md:text-sm text-gray-400 font-creato">
                {step === "verify"
                  ? `Verification code sent to ${email || "your email"}`
                  : "Enter your registered email id."}
              </p>
            </div>

            {/* Form */}
            <Form
              form={form}
              layout="vertical"
              // onFinish={step === "email" ? handleSendCode : handleUpdatePassword}
              onFieldsChange={handleFormFieldsChange}
              onValuesChange={handleFormValuesChange}
              requiredMark={false}
            >
              {step === "email" ? (
                <>
                  <FormField
                    type="text"
                    label="Email ID"
                    name="email"
                    placeholder="Enter your email address"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                    onChange={handleEmailChange}

                  />

                  {/* 
                                        COMMENTED OUT: hide "Email is not registered" while typing.
                                        We only show this via toast when user clicks Send (handleSendCode).
                                    */}

                  {/* {!checkingEmail && form.getFieldValue("email") && !emailExists && (
                                        <div className="text-red-500 text-xs mt-[-12px] mb-3">Email is not registered</div>
                                    )} */}

                  <div className="mt-6">
                    <CustomButton
                      variant={loading || !isEmailValid ? "disabled" : "primary"}
                      type="button"
                      disabled={loading || !isEmailValid}
                      onClick={handleSendCode}
                      className={`mt-0 ${loading || !isEmailValid
                        ? "!cursor-not-allowed"
                        : "cursor-pointer"
                        }`}
                    >
                      {loading ? "Sending..." : "Send Verification Code"}
                      <img
                        src={
                          loading || !isEmailValid
                            ? "/arrow-right.svg"
                            : "/arrow-right-active.png"
                        }
                        alt=""
                        className="w-4 h-4"
                      />
                    </CustomButton>


                  </div>
                </>
              ) : (
                <>
                  {/* VERIFY STEP - using FormField for all inputs */}
                  <FormField
                    type="otp"
                    label="Verification Code"
                    name="verificationCode"
                    placeholder="Enter Verification Code"
                    maxLength={6}
                    // rules={[{ required: true, message: "Please enter verification code" }]}
                    className="!mb-2"
                  />

                  <FormField
                    type="password"
                    label="New Password"
                    name="newPassword"
                    placeholder="Enter new password"
                    // rules={[{ required: true, message: "Please enter new password" }, passwordPatternRule]}
                    prefix={<LockOutlined />}
                    className="!mb-2"
                  />

                  <FormField
                    type="password"
                    label="Confirm New Password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    dependencies={["newPassword"]}
                    // rules={[
                    //     { required: true, message: "Please confirm new password" },
                    //     ({ getFieldValue }) => ({
                    //         validator(rule, value) {
                    //             if (!value || getFieldValue("newPassword") === value) {
                    //                 return Promise.resolve();
                    //             }
                    //             return Promise.reject("Passwords do not match");
                    //         },
                    //     }),
                    // ]}
                    prefix={<LockOutlined />}
                    className="!mb-2"
                  />

                  {/* password rules checklist (above the update button) */}
                  {/* ultra-compact password rules */}
                  {/* Password rule block – matches screenshot style */}
                  {/* <div className="mt-2">
                                        <div
                                            className={`text-[12px] leading-[16px] font-creato transition-all duration-200 ${Object.values(pwdChecks).every(Boolean) ? "text-green-700" : "text-gray-600"
                                                }`}
                                        >
                                            At least one lowercase, one uppercase, one number,<br />
                                            one special character – [!@#$%^&*(),.?":{ }|], Minimum 12 characters
                                        </div>
                                    </div> */}
                  {/* <div className="mb-3 text-[12px] leading-[13px] text-gray-600 font-creato mt-3">
                        <div className={pwdChecks.length ? "text-[#1D5C1B]" : ""}>
                            • Minimum 12 characters
                        </div>
                        <div className={pwdChecks.lowercase ? "text-[#1D5C1B]" : ""}>
                            • At least 1 lowercase letter
                        </div>
                        <div className={pwdChecks.uppercase ? "text-[#1D5C1B]" : ""}>
                            • At least 1 uppercase letter
                        </div>
                        <div className={pwdChecks.number ? "text-[#1D5C1B]" : ""}>
                            • At least 1 number
                        </div>
                        <div className={pwdChecks.special ? "text-[#1D5C1B]" : ""}>
                            • At least 1 special character from [!@#$%^&*(),.?":{ }|]
                        </div>
                    </div> */}
                  <div className="mt-2 text-[12px] leading-[16px] font-creato">
                    <span
                      className={
                        pwdChecks.lowercase ? "text-[#119d0c]" : "text-gray-600"
                      }
                    >
                      At least one lowercase
                    </span>
                    {", "}

                    <span
                      className={
                        pwdChecks.uppercase ? "text-[#119d0c]" : "text-gray-600"
                      }
                    >
                      one uppercase
                    </span>
                    {", "}

                    <span
                      className={
                        pwdChecks.number ? "text-[#119d0c]" : "text-gray-600"
                      }
                    >
                      one number
                    </span>
                    {","}
                    <br />

                    <span
                      className={
                        pwdChecks.special ? "text-[#119d0c]" : "text-gray-600"
                      }
                    >
                      one special character – [!@#$%^&*(),.?":{ }|]
                    </span>
                    {", "}

                    <span
                      className={
                        pwdChecks.length ? "text-[#119d0c]" : "text-gray-600"
                      }
                    >
                      Minimum 12 characters
                    </span>
                  </div>

                  {/* global error block - shows all errors here (no toast for validation except mismatch/server) */}
                  {fieldErrors.length > 0 && (
                    <div className="text-red-500 text-xs mb-3 space-y-1">
                      {fieldErrors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2">
                    <CustomButton
                      variant="primary"
                      type="button"
                      // enable only when all rules satisfied and passwords match and verification code is present
                      disabled={
                        loading ||
                        !allRulesSatisfied ||
                        (form.getFieldValue("newPassword") || "") !==
                        (form.getFieldValue("confirmPassword") || "") ||
                        !(form.getFieldValue("verificationCode") || "")
                      }
                      onClick={handleUpdatePassword}
                      className="w-full rounded-lg py-3 flex items-center justify-center gap-3 text-white text-base font-medium disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Updating..." : "Update Password"}
                      <img
                        src="/arrow-right-active.png"
                        alt=""
                        className="w-4 h-4"
                      />
                    </CustomButton>
                  </div>
                </>
              )}

              {/* common back to login */}
              <div className="mt-5 text-center font-creato">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-Colors-Text-Primary-primary cursor-pointer text-sm font-medium hover:underline"
                >
                  Back to Log In
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* bottom logo */}
      <img
        src="/loandna_logo.png"
        alt="Brand Logo"
        className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
      />
    </div >
  );
}
