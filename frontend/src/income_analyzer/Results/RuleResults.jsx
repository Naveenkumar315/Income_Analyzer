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

export default function RuleResults({ rules = [] }) {
    return (
        <div className="space-y-4">
            {rules.map((item, index) => (
                <RuleItem key={index} index={index} item={item} />
            ))}
        </div>
    );
}

/* ------------------ RULE ITEM ------------------ */
function RuleItem({ item, index }) {
    const [open, setOpen] = useState(true);

    // ---- REAL DATA MAPPING ----
    const title = item?.result?.rule || "—";
    const statusRaw = item?.result?.status || "Error";
    const commentary = item?.result?.commentary || "—";
    const ruleText = item?.rule || "—";

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
                        Rule {index + 1}:
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
                    <Row label="Rule:">
                        {ruleText}
                    </Row>

                    <Row label="Calculation Commentary:">
                        <div className="bg-[#E9F6FC] text-[#11699E] px-3 py-2 rounded">
                            {commentary}
                        </div>
                    </Row>

                    <Row label="Documents Used:">
                        <span className="text-gray-400">No documents</span>
                    </Row>
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
