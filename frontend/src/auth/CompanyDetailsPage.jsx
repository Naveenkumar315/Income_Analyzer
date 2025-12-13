// src/pages/CompanyDetailsPage.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Form, message } from "antd";
import { UploadOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "antd/dist/reset.css";
import "../styles/formValidation.css"; // Import reusable form validation styles
import toast from "react-hot-toast";

import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { statesList } from "../constants/states";
import { debounce } from "../utils/debounce";
import authApi from "../api/authApi";

const CompanyDetailsPage = ({ onClose, onSubmit, userEmail }) => {
    const [activeTab, setActiveTab] = useState("company"); // "company" | "individual"
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [fileList, setFileList] = useState([]);
    const [isLoadingZip, setIsLoadingZip] = useState(false);
    const [loading, setLoading] = useState(false);

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );


    const handleFinish = useCallback(
        async (values) => {
            try {
                setLoading(true);
                console.log("Company / Individual details:", { tab: activeTab, values });

                // Prepare signup data based on type
                const signupData = {
                    email: userEmail?.trim()?.toLowerCase(),
                    type: activeTab, // "company" or "individual"
                };

                if (activeTab === "company") {
                    const username =
                        `${values.primaryFirstName || ""} ${values.primaryLastName || ""}`.trim();

                    signupData.username = username; //
                    // Structure company data
                    signupData.companyInfo = {
                        companyName: values.companyName,
                        companySize: values.companySize,
                        companyPhone: values.companyPhone,
                        companyEmail: values.companyEmail,
                    };
                    signupData.companyAddress = {
                        streetAddress: values.streetAddress,
                        zipCode: values.zipCode,
                        city: values.city,
                        state: values.state,
                    };
                    signupData.primaryContact = {
                        firstName: values.primaryFirstName,
                        lastName: values.primaryLastName,
                        phone: values.primaryPhone,
                        email: values.primaryEmail,
                    };
                } else if (activeTab === "individual") {
                    const username =
                        `${values.firstName || ""} ${values.lastName || ""}`.trim();

                    signupData.username = username;
                    // Structure individual data
                    signupData.individualInfo = {
                        firstName: values.firstName,
                        lastName: values.lastName,
                        phone: values.phone,
                        email: values.email?.trim()?.toLowerCase(),
                    };
                }
                console.log('signupData', signupData);

                // Call signup API
                const response = await authApi.signup(signupData);
                console.log("Signup successful:", response);

                toast.success("Registration successful!");

                // Close the modal and navigate to success page
                if (onSubmit) onSubmit({ tab: activeTab, values });
                if (onClose) onClose();
            } catch (error) {
                console.error("Signup error:", error);
                toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
            } finally {
                setLoading(false);
            }
        },
        [activeTab, userEmail, onSubmit, onClose]
    );

    // Handle tab switching - clear form when switching tabs
    const handleTabChange = (newTab) => {
        if (newTab !== activeTab) {
            // Clear all form fields
            form.resetFields();
            // Clear uploaded files
            setFileList([]);
            // Switch tab
            setActiveTab(newTab);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i)) + sizes[i];
    };

    // Fetch city and state from zip code
    const fetchLocationByZip = async (zipCode) => {
        // Validate US zip code format (5 digits)
        if (!/^\d{5}$/.test(zipCode)) {
            return;
        }

        setIsLoadingZip(true);
        try {
            const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

            if (!response.ok) {
                throw new Error('Invalid zip code');
            }

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                const place = data.places[0];
                const cityName = place['place name'];
                const stateAbbr = place['state abbreviation'];

                // Update form fields
                form.setFieldsValue({
                    city: cityName,
                    state: stateAbbr
                });
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
            // Optionally show error message to user
        } finally {
            setIsLoadingZip(false);
        }
    };

    // Create debounced version of the fetch function
    const debouncedFetchLocation = useRef(
        debounce((zipCode) => fetchLocationByZip(zipCode), 500)
    ).current;

    // Handle zip code change
    const handleZipCodeChange = (e) => {
        const zipCode = e.target.value;
        if (zipCode && zipCode.length === 5) {
            debouncedFetchLocation(zipCode);
        }
    };

    // Handle phone number input - format as US phone number (XXX) XXX-XXXX
    const handlePhoneNumberChange = (e) => {
        const input = e.target.value;

        // Remove all non-numeric characters
        const cleaned = input.replace(/\D/g, "");

        // Limit to 10 digits
        const limited = cleaned.substring(0, 10);

        // Format as (XXX) XXX-XXXX
        let formatted = "";
        if (limited.length > 0) {
            if (limited.length <= 3) {
                formatted = `(${limited}`;
            } else if (limited.length <= 6) {
                formatted = `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
            } else {
                formatted = `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
            }
        }

        // Update the form field value
        const fieldName = e.target.id?.replace(/.*_/, ''); // Extract field name from Ant Design ID
        if (fieldName) {
            form.setFieldsValue({
                [fieldName]: formatted
            });
        }
    };

    // FormSubmit
    const handleFormSumbit = () => {
        debugger
        console.log(form)

    }

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
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
                    <div className="text-lg font-creato font-normal text-[#3D4551]">
                        Getting Started
                    </div>
                    {/* <button
                        type="button"
                        // onClick={onClose}
                        className="text-[#9CA4AB] hover:text-[#3D4551] transition-colors"
                    >
                        <CloseOutlined style={{ fontSize: '18px' }} />
                    </button> */}
                </div>

                {/* body (scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {/* tabs */}
                    <div className="mb-8 inline-flex rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => handleTabChange("company")}
                            className={`h-10 px-6 text-sm font-creato transition-all ${activeTab === "company"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#3D4551] hover:bg-gray-50"
                                }`}
                        >
                            Company
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange("individual")}
                            className={`h-10 px-6 text-sm font-creato transition-all border-l border-[#E5E7EB] ${activeTab === "individual"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#3D4551] hover:bg-gray-50"
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
                        initialValues={{
                            companySize: "1-10",
                            primaryEmail: userEmail || "",
                            email: userEmail || ""
                        }}
                    >
                        {activeTab === "company" ? (
                            <>
                                {/* Company Information */}
                                <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                                    Company Information
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                                    <FormField
                                        type="text"
                                        label="Company Name"
                                        name="companyName"
                                        placeholder="Enter Company Name"
                                        rules={[{ required: true, message: "Please enter a Company Name" }]}

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
                                        rules={[{ required: true }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Company Phone Number"
                                        name="companyPhone"
                                        placeholder="Enter Company Phone Number"
                                        onChange={handlePhoneNumberChange}
                                        rules={[{ required: true, message: "Please enter a Company Phone Number" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Company Email"
                                        name="companyEmail"
                                        placeholder="Enter Company Email"
                                        rules={[
                                            { required: true, message: "Please enter a Company Email" },
                                            { type: "email", message: "Invalid email format" }
                                        ]}
                                    />
                                </div>

                                {/* Company Address */}
                                <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                                    Company Address
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                                    <FormField
                                        type="text"
                                        label="Street Address"
                                        name="streetAddress"
                                        placeholder="Enter Street Address"
                                        rules={[{ required: true, message: "Please enter a Street Address" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Zip Code"
                                        name="zipCode"
                                        placeholder="Enter Zip Code"
                                        onChange={handleZipCodeChange}
                                        maxLength={5}
                                        rules={[{ required: true, message: "Please enter a Zip Code" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="City"
                                        name="city"
                                        placeholder="Enter City"
                                        disabled={isLoadingZip}
                                        rules={[{ required: true, message: "Please enter a City" }]}
                                    />
                                    <FormField
                                        type="dropdown"
                                        label="State"
                                        name="state"
                                        placeholder="Select State"
                                        options={statesList}
                                        disabled={isLoadingZip}
                                        rules={[{ required: true, message: "Please select a state"}]}
                                    />
                                </div>

                                {/* Primary Contact */}
                                <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                                    Primary Contact
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                                    <FormField
                                        type="text"
                                        label="First Name"
                                        name="primaryFirstName"
                                        placeholder="Enter First Name"
                                        rules={[{ required: true, message: "Please enter a First Name" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Last Name"
                                        name="primaryLastName"
                                        placeholder="Enter Last Name"
                                        rules={[{ required: true, message: "Please enter a Last Name" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Phone Number"
                                        name="primaryPhone"
                                        placeholder="Enter Phone Number"
                                        onChange={handlePhoneNumberChange}
                                        rules={[{ required: true, message: "Please enter a Phone Number" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Email"
                                        name="primaryEmail"
                                        placeholder="Enter Email"
                                        disabled={true}
                                        rules={[
                                            { required: true, message: "Please enter an Email" },
                                            { type: "email", message: "Invalid email format" }
                                        ]}
                                    />
                                </div>

                                {/* Company Logo */}
                                <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                                    Company Logo{" "}
                                    <span className="text-[#9CA4AB] text-sm font-normal">
                                        (Optional)
                                    </span>
                                </div>

                                {/* Upload Area */}
                                <div
                                    className="relative border-2 border-dashed border-[#E5E7EB] rounded-lg bg-[#F9FAFB] hover:border-[#22B4E6] transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('logo-upload-input').click()}
                                >
                                    <input
                                        id="logo-upload-input"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFileList([e.target.files[0]]);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="py-12 text-center">
                                        <div className="mb-3">
                                            <UploadOutlined style={{ fontSize: '40px', color: '#22B4E6' }} />
                                        </div>
                                        <p className="text-sm font-creato mb-1">
                                            <span className="text-[#22B4E6] font-medium">Upload a file</span>
                                            <span className="text-[#6B7280]"> or drag and drop</span>
                                        </p>
                                        <p className="text-xs font-creato text-[#9CA4AB]">
                                            png, jpeg, up to 2MB
                                        </p>
                                    </div>
                                </div>

                                {/* Uploaded file list */}
                                {fileList.length > 0 && (
                                    <div className="mt-4">
                                        {fileList.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileTextOutlined style={{ fontSize: '24px', color: '#22B4E6' }} />
                                                    <div>
                                                        <div className="text-sm font-creato font-medium text-[#3D4551]">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-xs font-creato text-[#9CA4AB]">
                                                            {formatFileSize(file.size)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFileList([])}
                                                    className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
                                                >
                                                    <DeleteOutlined style={{ fontSize: '18px' }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Individual – Basic Information */}
                                <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                                    Basic Information
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <FormField
                                        type="text"
                                        label="First Name"
                                        name="firstName"
                                        placeholder="Enter First Name"
                                        rules={[{ required: true, message: "Please enter a First Name" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Enter Last Name"
                                        rules={[{ required: true, message: "Please enter a Last Name" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Phone Number"
                                        name="phone"
                                        placeholder="Enter Phone Number"
                                        onChange={handlePhoneNumberChange}
                                        rules={[{ required: true, message: "Please enter a Phone Number" }]}
                                    />
                                    <FormField
                                        type="text"
                                        label="Email"
                                        name="email"
                                        placeholder="Enter Email"
                                        disabled={true}
                                        rules={[
                                            { required: true, message: "Please enter an Email" },
                                            { type: "email", message: "Invalid email format" }
                                        ]}
                                    />
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Fixed footer bar */}
                <div className="border-t border-[#E5E7EB] px-8 py-4 flex justify-end gap-3 bg-white rounded-b-xl">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-8 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#3D4551] text-sm font-creato font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        style={{ color: 'white' }}
                        type="submit"
                        // onClick={handleFormSumbit}
                        className="px-8 py-2.5 rounded-lg bg-[#22B4E6] text-white text-sm font-creato font-medium hover:bg-[#1DA1D1] transition-colors"
                        disabled={loading}
                        onClick={() => form.submit()}
                    // className="px-8 py-2.5 rounded-lg bg-[#22B4E6] text-white text-sm font-creato font-medium hover:bg-[#1DA1D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </button>
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

