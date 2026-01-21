import React from "react";

export default function REO({ data = [] }) {
    if (!data.length) {
        return (
            <div className="p-6 text-gray-500 text-center">
                No REO data available
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div
                    key={index}
                    className="rounded-lg bg-white px-5 py-4"
                    style={{
                        border: '1px solid #E0E0E0'
                    }}
                >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Left - Value Label + Field Name */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm" style={{ color: '#9CA3AF' }}>
                                Value:
                            </span>
                            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                                {item.field}
                            </span>
                            <span
                                className="px-2 py-0.5 text-xs rounded-2xl font-medium"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    color: '#1A1A1A',
                                    border: item.status === "Pass" ? '1px solid #46DB41' : '1px solid #EF4444'
                                }}
                            >
                                {item.status}
                            </span>
                        </div>

                        {/* Right - Value Amount */}
                        <div className="text-sm font-semibold" style={{ color: '#303030' }}>
                            Value: {item.value}
                        </div>
                    </div>

                    {/* Commentary Row */}
                    <div className="flex mb-4">
                        <div className="text-sm w-48 flex-shrink-0" style={{ color: '#9CA3AF' }}>
                            Commentary:
                        </div>
                        <div className="text-sm flex-1 leading-relaxed" style={{ color: '#1A1A1A' }}>
                            {item.commentary}
                        </div>
                    </div>

                    {/* Calculation Commentary Row */}
                    <div className="flex">
                        <div className="text-sm w-48 flex-shrink-0" style={{ color: '#9CA3AF' }}>
                            Calculation Commentary:
                        </div>
                        <div className="text-sm flex-1 leading-relaxed" style={{ color: '#1A1A1A' }}>
                            {item.calculation_commentry}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}