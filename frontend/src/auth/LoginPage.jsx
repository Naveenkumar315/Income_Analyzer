import { useState } from "react";
import { Form, Input } from "antd";
import "antd/dist/reset.css";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate()

    const onFinish = (values) => {
        setLoading(true);
        console.log("Login:", values);
        setTimeout(() => setLoading(false), 1000);
    };

    const handleFieldsChange = () => {
        const values = form.getFieldsValue();
        const valid =
            values.username?.trim()?.length > 0 &&
            values.password?.trim()?.length > 0;

        setIsFormValid(valid);
    };

    const handleNavigate = () => {
        navigate('/signup')
    }

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
                    {/* USERNAME */}
                    <FormField
                        type="text"
                        label="Username"
                        name="username"
                        placeholder="Enter Username"
                        rules={[{ required: true, message: "Please enter username" }]}
                    />


                    {/* PASSWORD */}
                    <FormField
                        type="password"
                        label="Password"
                        name="password"
                        placeholder="Enter Password"
                        rules={[{ required: true, message: "Please enter password" }]}
                    />



                    {/* Forgot password */}
                    <div className="text-Colors-Text-Primary-primary text-sm font-medium font-creato leading-4 cursor-pointer mb-6">
                        Forgot password?
                    </div>

                    {/* Login button with dynamic variant + icon */}
                    <CustomButton
                        variant={isFormValid ? "primary" : "disabled"}
                        type="submit"
                        className="mt-0"
                    >
                        Login
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
                            Don’t have an account?
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
