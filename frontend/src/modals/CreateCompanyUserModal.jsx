import React, { useState } from "react";
import { Modal, Button, Form } from "antd";
import FormField from "../components/FormField";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateCompanyUserModal = ({
    open,
    onCancel,
    onCreate,
    confirmLoading = false,
}) => {
    const [form] = Form.useForm();
    const [isEmailValid, setIsEmailValid] = useState(false);

    // ================= EMAIL VALIDATION (Same as Signup) =================
    const handleEmailChange = (e) => {
        const value = e.target.value.trim();
        const isValid = EMAIL_REGEX.test(value);

        setIsEmailValid(isValid);

        form.setFieldsValue({
            email: value,
        });
    };

    // ================= PHONE FORMATTER =================
    const handlePhoneNumberChange = (e) => {
        const input = e.target.value;
        const cleaned = input.replace(/\D/g, "").substring(0, 10);

        let formatted = "";
        if (cleaned.length <= 3) {
            formatted = cleaned ? `(${cleaned}` : "";
        } else if (cleaned.length <= 6) {
            formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
            formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        form.setFieldsValue({ phone: formatted });
    };

    return (
        <Modal
            title="Create Company User"
            open={open}
            onCancel={() => {
                form.resetFields();
                setIsEmailValid(false);
                onCancel();
            }}
            width={640}
            centered
            destroyOnClose
            maskClosable={false}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={confirmLoading}
                    disabled={!isEmailValid || confirmLoading}
                    onClick={() => form.submit()}
                >
                    Create User
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={(values) => {
                    const payload = {
                        email: values.email.trim().toLowerCase(),
                        username: `${values.firstName} ${values.lastName}`,
                        role: values.role,
                        type: "company",
                        isCompanyAdmin: values.role === "Admin",
                        primaryContact: {
                            firstName: values.firstName,
                            lastName: values.lastName,
                            phone: values.phone,
                            email: values.email.trim().toLowerCase(),
                        },
                    };

                    onCreate(payload);
                    form.resetFields();
                    setIsEmailValid(false);
                }}
            >
                {/* ================= PRIMARY CONTACT ================= */}
                <div className="mb-4 text-[#22B4E6] text-base font-creato">
                    Primary Contact
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                        type="text"
                        label="First Name *"
                        name="firstName"
                        placeholder="Enter First Name"
                        rules={[{ required: true, message: "First name is required" }]}
                    />

                    <FormField
                        type="text"
                        label="Last Name *"
                        name="lastName"
                        placeholder="Enter Last Name"
                        rules={[{ required: true, message: "Last name is required" }]}
                    />

                    <FormField
                        type="text"
                        label="Email *"
                        name="email"
                        placeholder="Enter Email"
                        onChange={handleEmailChange}
                        rules={[
                            { required: true, message: "Email is required" },
                            { type: "email", message: "Invalid email format" },
                        ]}
                    />

                    <FormField
                        type="text"
                        label="Phone Number *"
                        name="phone"
                        placeholder="Enter Phone Number"
                        onChange={handlePhoneNumberChange}
                        rules={[{ required: true, message: "Phone number is required" }]}
                    />
                </div>

                {/* ================= ROLE ================= */}
                <div className="mt-6 mb-4 text-[#22B4E6] text-base font-creato">
                    Role
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                        type="dropdown"
                        label="User Role *"
                        name="role"
                        placeholder="Select Role"
                        options={[
                            { label: "Admin", value: "Admin" },
                            { label: "User", value: "User" },
                        ]}
                        rules={[{ required: true, message: "Role is required" }]}
                    />
                </div>
            </Form>
        </Modal>
    );
};

export default CreateCompanyUserModal;
