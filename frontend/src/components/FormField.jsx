import React from "react";
import { Input, Select, Form } from "antd";

export default function FormField({
    type = "text",            // "text" | "password" | "dropdown"
    label,
    name,
    placeholder,
    rules = [],
    options = [],
    required = false,
    className = "",
    onChange,
    maxLength,
    disabled,
    ...restProps  // Capture any other props
}) {
    return (
        <Form.Item
            name={name}
            label={
                label && (
                    <span className="text-base-custom text-sm  font-creato  leading-4">
                        {label}
                    </span>
                )
            }
            rules={rules}
            required={required}
            className={`!mb-3 ${className}`}
        >
            {type === "password" ? (
                <Input.Password
                    placeholder={placeholder}
                    onChange={onChange}
                    maxLength={maxLength}
                    disabled={disabled}
                    {...restProps}
                    className="
            h-10 px-3 py-2
            rounded-lg
            bg-neutral-subtle
            border border-base-custom
            shadow-sm
            text-sm font-creato
            text-base-lightest-custom
            placeholder-base-lightest-custom
          "
                />
            ) : type === "dropdown" ? (
                <Select
                    placeholder={placeholder}
                    options={options}
                    onChange={onChange}
                    disabled={disabled}
                    {...restProps}
                    className="
            h-10 rounded-lg
            bg-neutral-subtle
            border-base-custom
            shadow-sm font-creato text-sm
            text-base-lightest-custom
          "
                />
            ) : (
                <Input
                    placeholder={placeholder}
                    onChange={onChange}
                    maxLength={maxLength}
                    disabled={disabled}
                    {...restProps}
                    className="
            h-10 px-3 py-2
            rounded-lg
            bg-neutral-subtle
            border border-base-custom
            shadow-sm
            text-sm font-creato
            text-base-lightest-custom
            placeholder-base-lightest-custom
          "
                />
            )}
        </Form.Item>
    );
}

