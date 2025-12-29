import React, { useState } from "react";
import { Modal, Form } from "antd";
import FormField from "../components/FormField";
import { useApp } from "../contexts/AppContext";
import authApi from "../api/authApi";
import toast from "../utils/ToastService";
import { phoneValidation, emailValidation, nameValidation } from "../utils/validation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateCompanyUserModal = ({
    open,
    onCancel,
    onCreate,
    confirmLoading = false,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useApp();

    // ================= EMAIL VALIDATION =================
    const handleEmailChange = (e) => {
        const value = e.target.value.trim();
        const isValid = EMAIL_REGEX.test(value);

        setIsEmailValid(isValid);

        form.setFieldsValue({
            email: value,
        });
    };

    const formatPhone = (value) => {
          const digits = value.replace(/\D/g, "").slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6)
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const handlePhoneBlur = () => {
        const value = form.getFieldValue("phone");
        if (!value) return;

        const digits = value.replace(/\D/g, "");

        if (digits.length === 10) {
            const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            form.setFieldsValue({ phone: formatted });
        }

        form.validateFields(["phone"]);
    };


    // ================= PHONE FORMATTER =================
    // const handlePhoneNumberChange = (e) => {
    //     const input = e.target.value;
    //     const cleaned = input.replace(/\D/g, "").substring(0, 10);

    //     let formatted = "";
    //     if (cleaned.length <= 3) {
    //         formatted = cleaned ? `(${cleaned}` : "";
    //     } else if (cleaned.length <= 6) {
    //         formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    //     } else {
    //         formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    //     }

    //     form.setFieldsValue({ phone: formatted });
    // };

    const handlePhoneNumberChange = (fieldName) => (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);

    form.setFieldsValue({
    [fieldName]: digitsOnly,
    });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const payload = {
                company_admin_id: user._id,
                email: values.email.trim().toLowerCase(),
                firstName: values.firstName,
                lastName: values.lastName,
                role: values.role,
                phone: values.phone.replace(/\D/g,"")
            };

            const response = await authApi.createCompanyUser(payload);
            toast.success("User created successfully");
            form.resetFields();
            setIsEmailValid(false);
            onCancel();
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error(err?.detail || "Failed to create user");
            if (err?.detail === "Email already registered") {
                form.setFields([
                    {
                        name: 'email',
                        errors: [' '], 
                    },
                ]);
                form.setFields([
                    {
                        name: 'email',
                        errors: [' '], 
                    },
                ]);
            }
        }finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={() => {
                form.resetFields();
                setIsEmailValid(false);
                onCancel();
            }}
            width={720}
            centered
            destroyOnHidden
            maskClosable={false}
            footer={null}
            wrapClassName="custom-company-user-modal"
            styles={{
                body: {
                    padding: 0,
                },
                content: {
                    borderRadius: '15px',
                    overflow: 'hidden',
                }
            }}
        >
            <div className="flex flex-col max-h-[80vh] -mx-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 mx-6">
                    <div className="text-lg font-creato font-normal text-[#3D4551]">
                        Create Company User
                    </div>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 py-6 mx-6">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        requiredMark={false}
                    >
                        {/* Primary Contact */}
                        <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                            Primary Contact
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                            <FormField
                                type="text"
                                label={
                                    <span>
                                        First Name <span className="text-red-500">*</span>
                                    </span>
                                }
                                name="firstName"
                                placeholder="Enter First Name"
                                rules={nameValidation("First Name")}
                            />
                            <FormField
                                type="text"
                                label={
                                    <span>
                                        Last Name <span className="text-red-500">*</span>
                                    </span>
                                }
                                name="lastName"
                                placeholder="Enter Last Name"
                                rules={nameValidation("Last Name")}
                            />
                            <FormField
                                type="text"
                                label={
                                    <span>
                                        Email <span className="text-red-500">*</span>
                                    </span>
                                }
                                name="email"
                                placeholder="Enter Email"
                                onChange={handleEmailChange}
                                rules={emailValidation}
                            />
                            <FormField
                                type="text"
                                label={
                                    <span>
                                        Phone Number <span className="text-red-500">*</span>
                                    </span>
                                }
                                name="phone"
                                placeholder="Enter Phone Number"
                                rules={phoneValidation}
                                validateTrigger={["onChange", "onBlur"]}
                                onChange={handlePhoneNumberChange("phone")}
                                onBlur={() => handlePhoneBlur("phone")}
                            />
                        </div>

                        {/* Role */}
                        <div className="mb-4 text-[#22B4E6] text-base font-creato font-normal">
                            Role
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField
                                type="dropdown"
                                label={
                                    <span>
                                        User Role <span className="text-red-500">*</span>
                                    </span>
                                }
                                name="role"
                                placeholder="Select Role"
                                options={[
                                    { label: "Admin", value: "Admin" },
                                    { label: "User", value: "User" },
                                ]}
                                rules={[{ required: true, message: "Please select a role" }]}
                            />
                        </div>
                    </Form>
                </div>

                {/* Fixed footer bar */}
                <div className="border-t border-[#E5E7EB] px-8 py-4 flex justify-end gap-3 bg-white rounded-b-xl mx-6">
                    <button
                        type="button"
                        onClick={() => {
                            form.resetFields();
                            setIsEmailValid(false);
                            onCancel();
                        }}
                        className="px-8 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#3D4551] text-sm font-creato font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        style={{ color: 'white' }}
                        type="submit"
                        onClick={() => form.submit()}
                        disabled={loading}
                        className="px-8 py-2.5 rounded-lg bg-[#22B4E6] text-white text-sm font-creato font-medium hover:bg-[#1DA1D1] transition-colors cursor-pointer"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateCompanyUserModal;