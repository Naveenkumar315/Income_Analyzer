// src/pages/CompanyDetailsPage.jsx
import React, { useState, useMemo, useCallback } from "react";
import { Form, Upload } from "antd";
import { CloseOutlined, InboxOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";

const { Dragger } = Upload;

const CompanyDetailsPage = ({ onClose, onSubmit }) => {
    const [activeTab, setActiveTab] = useState("company"); // "company" | "individual"
    const [form] = Form.useForm();

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

    const handleFinish = useCallback(
        (values) => {
            console.log("Company / Individual details:", { tab: activeTab, values });
            if (onSubmit) onSubmit({ tab: activeTab, values });
        },
        [activeTab, onSubmit]
    );

    const uploadProps = {
        name: "file",
        multiple: false,
        beforeUpload: () => false, // prevent auto upload; we just keep file in list
        showUploadList: {
            showRemoveIcon: true,
        },
    };

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

            {/* main modal card */}
            <div className="relative z-10 w-[720px] max-h-[80vh] rounded-xl bg-white shadow-md flex flex-col">
                {/* header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-4">
                    <div className="text-base font-creato text-base-custom">
                        Getting Started
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-base-lightest-custom hover:text-base-custom"
                    >
                        <CloseOutlined />
                    </button>
                </div>

                {/* body (scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 py-5">
                    {/* tabs */}
                    <div className="mb-6 inline-flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTab("company")}
                            className={`h-9 w-32 px-4 text-sm font-creato ${activeTab === "company"
                                ? "bg-Colors-Surface-Action-action text-Colors-Text-Static-white"
                                : "bg-white text-base-custom"
                                } border-r border-slate-200`}
                        >
                            Company
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("individual")}
                            className={`h-9 w-32 px-4 text-sm font-creato ${activeTab === "individual"
                                ? "bg-Colors-Surface-Action-action text-Colors-Text-Static-white"
                                : "bg-white text-base-custom"
                                }`}
                        >
                            Individual
                        </button>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        requiredMark={false}
                    >
                        {activeTab === "company" ? (
                            <>
                                {/* Company Information */}
                                <div className="mb-2 text-sky-500 text-[16px] font-creato font-medium">
                                    Company Information
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        type="text"
                                        label="Company Name"
                                        name="companyName"
                                        placeholder="Enter Company Name"
                                        rules={[{ required: true, message: "Please enter company name" }]}
                                    />
                                    <FormField
                                        type="dropdown"
                                        label="Company Size"
                                        name="companySize"
                                        placeholder="Select Company Size"
                                        options={[
                                            { label: "1–10", value: "1-10" },
                                            { label: "11–50", value: "11-50" },
                                            { label: "51–200", value: "51-200" },
                                            { label: "200+", value: "200+" },
                                        ]}
                                        rules={[
                                            { required: true, message: "Please select company size" },
                                        ]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Company Phone Number"
                                        name="companyPhone"
                                        placeholder="Enter Company Phone Number"
                                    />
                                    <FormField
                                        type="text"
                                        label="Company Email"
                                        name="companyEmail"
                                        placeholder="Enter Company Email"
                                        rules={[{ type: "email", message: "Please enter valid email" }]}
                                    />
                                </div>

                                {/* Company Address */}
                                <div className="mt-5 mb-2 text-sky-500 text-[16px] font-creato font-medium">
                                    Company Address
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        type="text"
                                        label="Street Address"
                                        name="streetAddress"
                                        placeholder="Enter Street Address"
                                    />
                                    <FormField
                                        type="text"
                                        label="Zip Code"
                                        name="zipCode"
                                        placeholder="Enter Zip Code"
                                    />
                                    <FormField
                                        type="text"
                                        label="City"
                                        name="city"
                                        placeholder="Enter City"
                                    />
                                    <FormField
                                        type="dropdown"
                                        label="State"
                                        name="state"
                                        placeholder="Select State"
                                        options={[
                                            { label: "Tamil Nadu", value: "TN" },
                                            { label: "Karnataka", value: "KA" },
                                            { label: "Kerala", value: "KL" },
                                            { label: "Telangana", value: "TS" },
                                        ]}
                                    />
                                </div>

                                {/* Primary Contact */}
                                <div className="mt-5 mb-2 text-sky-500 text-[16px] font-creato font-medium">
                                    Primary Contact
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        type="text"
                                        label="First Name"
                                        name="primaryFirstName"
                                        placeholder="Enter First Name"
                                    />
                                    <FormField
                                        type="text"
                                        label="Last Name"
                                        name="primaryLastName"
                                        placeholder="Enter Last Name"
                                    />
                                    <FormField
                                        type="text"
                                        label="Phone Number"
                                        name="primaryPhone"
                                        placeholder="Enter Phone Number"
                                    />
                                    <FormField
                                        type="text"
                                        label="Email"
                                        name="primaryEmail"
                                        placeholder="Enter Email"
                                        rules={[{ type: "email", message: "Please enter valid email" }]}
                                    />
                                </div>

                                {/* Company Logo */}
                                <div className="mt-5 mb-2 text-sky-500 text-[16px] font-creato font-medium">
                                    Company Logo{" "}
                                    <span className="text-base-lightest-custom text-xs">
                                        (Optional)
                                    </span>
                                </div>
                                <Dragger
                                    {...uploadProps}
                                    className="border-dashed border border-base-custom bg-neutral-subtle rounded-lg py-6"
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="text-sm font-creato text-base-custom">
                                        Upload a file or drag and drop
                                    </p>
                                    <p className="text-xs font-creato text-base-lightest-custom">
                                        PNG, JPEG up to 2MB
                                    </p>
                                </Dragger>
                            </>
                        ) : (
                            <>
                                {/* Individual – Basic Information */}
                                <div className="mb-2 text-sky-500 text-[16px] font-creato font-medium">
                                    Basic Information
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        type="text"
                                        label="First Name"
                                        name="firstName"
                                        placeholder="Enter First Name"
                                    />
                                    <FormField
                                        type="text"
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Enter Last Name"
                                    />
                                    <FormField
                                        type="text"
                                        label="Phone Number"
                                        name="phone"
                                        placeholder="Enter Phone Number"
                                    />
                                    <FormField
                                        type="text"
                                        label="Email"
                                        name="email"
                                        placeholder="Enter Email"
                                        rules={[{ type: "email", message: "Please enter valid email" }]}
                                    />
                                </div>
                            </>
                        )}
                        <p className="border-t border-slate-200 "></p>
                        {/* footer bar */}
                        <div className="mt-6 -mx-8 w-[300px] px-8 py-4 flex justify-end gap-3">
                            <CustomButton
                                variant="outline"
                                type="button"
                                className="w-28"
                                onClick={onClose}
                            >
                                Cancel
                            </CustomButton>
                            <CustomButton variant="primary" type="submit" className="w-28">
                                Submit
                            </CustomButton>
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
    );
};

export default CompanyDetailsPage;
