import React, { useEffect, useState } from "react";
import { Modal } from "antd";

const ProcessingLoaderModal = ({
    open,
    onStop,
    totalSteps = 10,
}) => {
    const [percent, setPercent] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);

    // demo animation – replace with real progress later
    useEffect(() => {
        if (!open) return;

        const interval = setInterval(() => {
            setPercent(prev => {
                if (prev >= 100) return 100;
                return prev + 1.2;
            });

            setCurrentStep(prev => {
                if (prev >= totalSteps) return totalSteps;
                return prev + 1;
            });
        }, 250);

        return () => clearInterval(interval);
    }, [open, totalSteps]);

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            centered
            width={900}
            styles={{
                content: { padding: 0, borderRadius: 16 },
                body: { padding: 0 }
            }}
        >
            <div className="min-h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-[#F7FBFF] to-[#EAF6FF] rounded-2xl">

                {/* Percentage Circle */}
                <div className="w-32 h-32 rounded-full border-[6px] border-[#E3F3FF] flex items-center justify-center">
                    <div className="text-3xl font-semibold text-[#1FA3E5]">
                        {Math.floor(percent)}%
                    </div>
                </div>

                {/* Title */}
                <div className="mt-6 text-[#3D4551] text-base font-medium">
                    Uploading and Cleaning JSON
                </div>

                {/* Subtitle */}
                <div className="text-sm text-gray-500 mt-1">
                    Extracting {currentStep} of {totalSteps}
                </div>

                {/* Progress bar */}
                <div className="w-3/4 mt-6">
                    <div className="h-2 rounded-full bg-white shadow-inner overflow-hidden">
                        <div
                            className="h-2 bg-[#1FA3E5] transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* Stop button */}
                <button
                    className="mt-8 px-8 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                    onClick={onStop}
                >
                    Stop
                </button>
            </div>
        </Modal>
    );
};

export default ProcessingLoaderModal;
