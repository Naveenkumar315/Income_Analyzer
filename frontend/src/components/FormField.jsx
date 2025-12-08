import React from "react";
import { Input, Select, Form } from "antd";

export default function FormField({
    type = "text", // "text" | "password" | "dropdown" | "numeric" | "otp"
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
    ...restProps // Capture any other props
}) {
    // helper: sanitize to digits only
    const sanitizeDigits = (value = "") => {
        return String(value).replace(/[^0-9]/g, "");
    };

    // shared props for inputs
    const baseInputProps = {
        placeholder,
        maxLength,
        disabled,
        ...restProps,
    };

    // handler wrapper to sanitize input and forward to parent onChange
    const handleChangeFactory = (externalOnChange) => (e) => {
        // e may be an event or direct value (Select), here for Input it's an event
        const raw = e && e.target ? e.target.value : e;
        const sanitized = sanitizeDigits(raw);
        // create a Synthetic-like event for parent if they expect event
        if (externalOnChange) {
            // If parent expects value directly (some components), try both:
            try {
                externalOnChange({ target: { value: sanitized } });
            } catch {
                // fallback: call with sanitized value
                externalOnChange(sanitized);
            }
        }
    };

    // block non-digit keypresses except control/navigation keys
    const handleKeyDownDigits = (e) => {
        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "Home",
            "End",
            "ArrowLeft",
            "ArrowRight",
        ];
        // allow Ctrl/Cmd+A/C/V/X shortcuts
        if (e.ctrlKey || e.metaKey) return;
        if (allowedKeys.includes(e.key)) return;
        // allow digits only
        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    };

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
                    {...baseInputProps}
                    onChange={onChange}
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
            ) : type === "numeric" ? (
                <Input
                    {...baseInputProps}
                    inputMode="numeric"
                    onChange={handleChangeFactory(onChange)}
                    onKeyDown={handleKeyDownDigits}
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
            ) : type === "otp" ? (
                // otp is same as numeric but emphasizes numeric keypad and styling for OTP
                <Input
                    {...baseInputProps}
                    inputMode="numeric"
                    onChange={handleChangeFactory(onChange)}
                    onKeyDown={handleKeyDownDigits}
                    maxLength={maxLength ?? 6}
                    className="
            h-10 px-3 py-2 text-center
            rounded-lg
            bg-neutral-subtle
            border border-base-custom
            shadow-sm
            text-sm font-creato
            text-base-lightest-custom
            placeholder-base-lightest-custom
          "
                />
            ) : (
                <Input
                    {...baseInputProps}
                    onChange={onChange}
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
