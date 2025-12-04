import React from "react";
import { Select, Form } from "antd";

export default function DropdownField({
    label,
    name,
    options = [],
    placeholder = "Select",
    rules = [],
    required = false,
    className = "",
}) {
    return (
        <Form.Item
            name={name}
            label={
                label && (
                    <span className="text-base-custom text-sm font-creato leading-4">
                        {label}
                    </span>
                )
            }
            required={required}
            rules={rules}
            className={`!mb-3 ${className}`}
        >
            <Select
                placeholder={placeholder}
                className="
          h-10 rounded-lg border-base-custom 
          bg-neutral-subtle
          shadow-sm font-creato text-sm
          text-base-lightest-custom
        "
                options={options}
            />
        </Form.Item>
    );
}
