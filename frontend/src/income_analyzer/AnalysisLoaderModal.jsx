import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { FileText, CheckCircle, Clock } from "lucide-react";

const AnalysisLoaderModal = ({
    open,
    onStop,
    currentStep = 0,
    totalSteps = 5,
    borrowerName = "",
    stepLabels = []
}) => {
    const [percent, setPercent] = useState(0);

    useEffect(() => {
        if (!open) {
            setPercent(0);
            return;
        }

        const target = Math.min((currentStep / totalSteps) * 100, 100);

        const id = setInterval(() => {
            setPercent(p => (p < target ? p + 1 : target));
        }, 20);

        return () => clearInterval(id);
    }, [open, currentStep, totalSteps]);

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            centered
            width={520}
            styles={{
                content: { padding: 0 },
                body: { padding: 0 }
            }}
        >
            <div className="flex flex-col items-center px-8 py-8 bg-gradient-to-br from-[#F7FBFF] to-[#EAF6FF] rounded-xl">

                {/* ICON */}
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full border-[5px] border-[#E3F3FF] bg-white flex items-center justify-center">
                        <FileText className="w-9 h-9 text-[#1FA3E5] animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1FA3E5] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {currentStep}/{totalSteps}
                    </div>
                </div>

                {/* BORROWER */}
                {borrowerName && (
                    <div className="text-[#1FA3E5] text-sm font-semibold mb-1">
                        {borrowerName}
                    </div>
                )}

                {/* STEP */}
                <div className="text-xs text-gray-600 flex items-center gap-1 mb-3">
                    <Clock className="w-4 h-4" />
                    {stepLabels[currentStep - 1] || "Initializing"}
                </div>

                {/* PROGRESS */}
                <div className="w-full mb-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span className="text-[#1FA3E5] font-semibold">
                            {percent}%
                        </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                            className="h-2 bg-[#1FA3E5]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* STEPS */}
                <div className="w-full space-y-2 mb-4">
                    {stepLabels.map((label, i) => {
                        const step = i + 1;
                        const done = currentStep > step;
                        const active = currentStep === step;

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-3 px-3 py-2 rounded border ${active
                                    ? "border-[#1FA3E5] bg-[#E3F3FF]"
                                    : done
                                        ? "border-green-200"
                                        : "border-gray-200 opacity-60"
                                    }`}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${done
                                        ? "bg-green-500"
                                        : active
                                            ? "bg-[#1FA3E5]"
                                            : "bg-gray-300"
                                        }`}
                                >
                                    {done ? <CheckCircle className="w-4 h-4" /> : step}
                                </div>
                                <span className="text-xs">{label}</span>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onStop}
                    className="px-6 py-2 text-xs border rounded hover:bg-gray-50"
                >
                    Cancel Analysis
                </button>
            </div>
        </Modal>
    );
};

export default AnalysisLoaderModal;
