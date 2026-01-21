import React from "react";
import { FileText } from "lucide-react";

export default function SelfEmployed({ data = {} }) {
    // Helper function to render value
    const renderValue = (value) => {
        if (value === null || value === undefined || value === "") {
            return "-";
        }
        // if (value === "0" || value === 0) {
        //     return "-";
        // }
        return value;
    };

    return (
        <div className="bg-white rounded-lg">


            {/* Content */}
            <div className="px-5 pb-5 space-y-4">
                {/* Borrower Type */}
                <div className="flex">
                    <div className="text-sm w-48" style={{ color: '#6B7280' }}>Borrower Type:</div>
                    <div className="text-sm flex-1" style={{ color: '#1A1A1A' }}>{data.borrower_type || "-"}</div>
                </div>

                {/* Status */}
                <div className="flex">
                    <div className="text-sm w-48" style={{ color: '#6B7280' }}>Status:</div>
                    <div className="text-sm flex-1" style={{ color: '#1A1A1A' }}>{data.status || "-"}</div>
                </div>

                {/* Documents Used */}
                <div className="flex">
                    <div className="text-sm w-48" style={{ color: '#6B7280' }}>Documents Used:</div>
                    <div className="flex-1">
                        {data.Documents_used && data.Documents_used.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.Documents_used.map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 px-3 py-2 rounded"
                                        style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
                                    >
                                        <FileText className="w-4 h-4" style={{ color: '#2563EB' }} />
                                        <span className="text-sm" style={{ color: '#1E3A8A' }}>{doc}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm" style={{ color: '#1A1A1A' }}>-</div>
                        )}
                    </div>
                </div>

                {/* Calculation Commentary */}
                <div className="flex">
                    <div className="text-sm w-48 flex-shrink-0" style={{ color: '#6B7280' }}>Calculation Commentary:</div>
                    <div className="text-sm flex-1 leading-relaxed" style={{ color: '#1A1A1A' }}>
                        {data.calculation_commentry || "-"}
                    </div>
                </div>

                {/* Commentary */}
                <div className="flex">
                    <div className="text-sm w-48 flex-shrink-0" style={{ color: '#6B7280' }}>Commentary:</div>
                    <div className="text-sm flex-1 leading-relaxed" style={{ color: '#1A1A1A' }}>
                        {data.commentary || "-"}
                    </div>
                </div>

                {/* Formulas Applied */}
                <div className="flex">
                    <div className="text-sm w-48" style={{ color: '#6B7280' }}>Formulas Applied:</div>
                    <div className="text-sm flex-1" style={{ color: '#1A1A1A' }}>{renderValue(data.formulas_applied)}</div>
                </div>

                {/* Final Math Formula */}
                <div className="flex">
                    <div className="text-sm w-48" style={{ color: '#6B7280' }}>Final Math Formula:</div>
                    <div className="text-sm flex-1" style={{ color: '#1A1A1A' }}>{renderValue(data.final_math_formula)}</div>
                </div>
            </div>
        </div>
    );
}