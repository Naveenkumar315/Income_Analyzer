import { useState } from "react";
import { DownOutlined } from "@ant-design/icons";
import { Icons } from "../../utils/icons";

/* ------------------ STATUS CONFIG ------------------ */
const STATUS_CONFIG = {
    pass: {
        label: "Pass",
        color: "text-[#12B7A1]",
        icon: Icons.analyticResult.circle_check_rule,
    },
    fail: {
        label: "Fail",
        color: "text-red-600",
        icon: Icons.analyticResult.circleClose,
    },
    error: {
        label: "Error",
        color: "text-red-600",
        icon: Icons.analyticResult.octagon_alert,
    },
    "insufficient data": {
        label: "Insufficient",
        color: "text-yellow-600",
        icon: Icons.analyticResult.circle_alert,
    },
};

export default function WageEarner({ data = [] }) {
    if (!data.length) {
        return (
            <div className="p-6 text-gray-500 text-center">
                No income calculation data available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <IncomeItem key={index} index={index} item={item} />
            ))}
        </div>
    );
}

const formatValue = (value) => {
    if (value === null || value === undefined) return "—";

    // If already a string with currency symbol
    if (typeof value === "string") {
        // Try to extract number
        const numeric = value.replace(/[^0-9.-]/g, "");
        const number = Number(numeric);

        if (!isNaN(number)) {
            const formatted = number.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            // Keep currency symbol if exists
            const symbol = value.trim().startsWith("$") ? "$" : "";
            return `${symbol}${formatted}`;
        }

        return value;
    }

    // If number
    if (typeof value === "number") {
        return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    return String(value);
};


/* ------------------ INCOME ITEM ------------------ */
function IncomeItem({ item, index }) {
    const [open, setOpen] = useState(true);

    const title = item?.field || "—";
    const value = item?.value || "—";
    const commentary = item?.commentary || "";
    const calculation = item?.calculation_commentry || "";
    const statusRaw = item?.status || "Error";

    const normalizedStatus = statusRaw.toLowerCase();
    const statusUI =
        STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.error;

    return (
        <div className="border border-gray-200 rounded-lg bg-white">
            {/* HEADER */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <div className="text-sm font-medium">
                    <span className="custom-font-jura text-[#969696]">
                        {/* Income {index + 1}: */}
                    </span>{" "}
                    <span className="custom-font-jura">{title}</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* STATUS */}
                    <div
                        className={`flex items-center gap-1 text-sm font-medium ${statusUI.color}`}
                    >
                        <img
                            src={statusUI.icon}
                            alt={statusUI.label}
                            className="w-4 h-4"
                        />
                        {statusUI.label}
                    </div>

                    {/* CHEVRON */}
                    <DownOutlined
                        className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </div>

            {/* BODY */}
            {open && (
                <div className="px-4 pb-4 text-sm text-gray-700 space-y-3">
                    <Row label="Value:">
                        <span className="font-medium text-gray-900">
                            {formatValue(value)}
                        </span>
                    </Row>

                    {commentary && (
                        <Row label="Commentary:">
                            <div className="bg-[#E9F6FC] text-[#11699E] px-3 py-2 rounded leading-relaxed">
                                {commentary}
                            </div>
                        </Row>
                    )}

                    {calculation && (
                        <Row label="Calculation:">
                            <div className="bg-[#F9FAFB] border border-gray-200 px-3 py-2 rounded space-y-1">
                                {calculation.split("\n").map((line, idx) => (
                                    <p key={idx}>{line}</p>
                                ))}
                            </div>
                        </Row>
                    )}
                </div>
            )}
        </div>
    );
}

/* ------------------ HELPERS ------------------ */
function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[180px_1fr] gap-4">
            <div className="text-gray-500">{label}</div>
            <div>{children}</div>
        </div>
    );
}
