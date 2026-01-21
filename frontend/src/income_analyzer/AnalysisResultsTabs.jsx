import { useState, useMemo } from "react";
import RuleResults from "./Results/RuleResults";
import { Icons } from "../utils/icons";
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { Button, Breadcrumb, Select, Spin } from 'antd';
import WageEarner from "./Results/WageEarner";
import BankStatement from "./Results/BankStatement";
import UnderWritingRulesModal from "./UnderWritingRulesModal";

export default function AnalysisResultsTabs({
    currentStep,
    setCurrentStep,
    borrowerList = [],
    selectedBorrower,
    setSelectedBorrower,
    analyzedData = {},
    processingBorrowers = new Set(),
    isLoading = false,
    onBackToDashboard,
}) {
    const [activeTab, setActiveTab] = useState("ruleResults");
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    // Get current borrower's data
    const currentBorrowerData = useMemo(() => {
        return selectedBorrower ? analyzedData[selectedBorrower] : null;
    }, [selectedBorrower, analyzedData]);

    // Calculate summary cards from current borrower data
    const ruleResultsCards = useMemo(() => {
        if (!currentBorrowerData?.rules) {
            return [
                { label: "Passed", count: "00", color: "bg-green-500", icon: Icons.analyticResult.circleCheck },
                { label: "Failed", count: "00", color: "bg-red-500", icon: Icons.analyticResult.circleClose },
                { label: "Insufficient", count: "00", color: "bg-yellow-500", icon: Icons.analyticResult.circle_alert },
                { label: "Error", count: "00", color: "bg-red-600", icon: Icons.analyticResult.octagon_alert }
            ];
        }

        const rules = currentBorrowerData.rules?.rule_result;
        const passed = rules?.Pass || 0;
        const failed = rules?.Fail || 0;
        const insufficient = rules["Insufficient data"] || 0;
        const error = rules?.Error || 0;

        return [
            { label: "Passed", count: passed.toString().padStart(2, '0'), color: "bg-green-500", icon: Icons.analyticResult.circleCheck },
            { label: "Failed", count: failed.toString().padStart(2, '0'), color: "bg-red-500", icon: Icons.analyticResult.circleClose },
            { label: "Insufficient", count: insufficient.toString().padStart(2, '0'), color: "bg-yellow-500", icon: Icons.analyticResult.circle_alert },
            { label: "Error", count: error.toString().padStart(2, '0'), color: "bg-red-600", icon: Icons.analyticResult.octagon_alert }
        ];
    }, [currentBorrowerData]);

    const wageEarnerCards = useMemo(() => {
        if (!currentBorrowerData?.income_summary) {
            return [
                { label: "Qualifying Income", value: "$0.00" },
                { label: "Bonus", value: "$0.00" },
                { label: "Commission", value: "$0.00" },
                { label: "Monthly Income", value: "$0.00" },
                { label: "Over Time", value: "$0.00" },
                { label: "Other Income", value: "$0.00" }
            ];
        }

        const income = currentBorrowerData.income_summary;
        return [
            { label: "Qualifying Income", value: income["Qualifying income"] || "$0.00" },
            { label: "Bonus", value: income["Bonus"] || "$0.00" },
            { label: "Commission", value: income["Comission"] || "$0.00" },
            { label: "Monthly Income", value: income["Monthly income"] || "$0.00" },
            { label: "Over Time", value: income["Over time"] || "$0.00" },
            { label: "Other Income", value: income["other income"] || "$0.00" }
        ];
    }, [currentBorrowerData]);

    // Check if current borrower has data
    const hasData = !!currentBorrowerData;
    const isCurrentBorrowerProcessing = processingBorrowers.has(selectedBorrower);

    // Create borrower options with disabled state
    const borrowerOptions = useMemo(() => {
        return borrowerList.map(borrower => {
            const isProcessing = processingBorrowers.has(borrower);
            const hasData = !!analyzedData[borrower];

            return {
                label: (
                    <div className="flex items-center justify-between w-full">
                        <span>{borrower}</span>
                        {/* {isProcessing && (
                            <Spin size="small" className="ml-2" />
                        )} */}
                    </div>
                ),
                value: borrower,
                disabled: isProcessing || !hasData
            };
        });
    }, [borrowerList, processingBorrowers, analyzedData]);

    return (
        <>
            <div className="px-2 py-1 flex items-center justify-between bg-[#F7F7F7]">
                <div className="flex items-center gap-3">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="text-Colors-Text-Primary-primary hover:text-teal-700 font-medium"
                        onClick={() => {
                            if (onBackToDashboard) {
                                onBackToDashboard();
                            } else {
                                setCurrentStep(4);
                            }
                        }}
                    >
                        Back
                    </Button>
                    <span className='border-l border-gray-300 h-6'></span>
                    <Breadcrumb
                        separator="›"
                        className="text-sm"
                        items={[
                            { title: <HomeOutlined /> },
                            { title: 'Loan ID' },
                            {
                                title: 'Upload & Extract Files',
                                className: currentStep === 4 ? 'text-gray-800 font-medium' : ''
                            },
                            {
                                title: 'Analysis Results',
                                className: currentStep === 5 ? '!text-gray-800 font-medium' : ''
                            }
                        ]}
                    />
                </div>
            </div>

            <div
                className="bg-white border-2 outer-Border rounded-xl flex flex-col min-h-0"
                style={{ height: "calc(100vh - 110px)" }}
            >
                {/* Tabs and Borrower Selector */}
                <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                    <div className="inline-flex rounded-lg border tab-Border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTab("ruleResults")}
                            className={`h-9 px-5 text-sm transition-all cursor-pointer ${activeTab === "ruleResults"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            Rule Results
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("wageEarner")}
                            className={`h-9 px-5 text-sm border-l tab-Border transition-all cursor-pointer ${activeTab === "wageEarner"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            Wage Earner
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("bankStatement")}
                            className={`h-9 px-5 text-sm border-l tab-Border transition-all cursor-pointer ${activeTab === "bankStatement"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            Bank Statement
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("selfEmployed")}
                            className={`h-9 px-5 text-sm border-l tab-Border transition-all cursor-pointer ${activeTab === "selfEmployed"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            Self Employed
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("reo")}
                            className={`h-9 px-5 text-sm border-l tab-Border transition-all cursor-pointer ${activeTab === "reo"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            REO
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("insights")}
                            className={`h-9 px-5 text-sm border-l tab-Border transition-all cursor-pointer ${activeTab === "insights"
                                ? "bg-[#9AD4EF] text-white"
                                : "bg-white text-[#4D4D4D] hover:bg-gray-50"
                                }`}
                        >
                            Insights
                        </button>
                    </div>

                    {/* Borrower Selector */}
                    <div className="borrower-field flex items-center gap-2">
                        <Select
                            value={selectedBorrower}
                            onChange={setSelectedBorrower}
                            placeholder="Select Borrower"
                            className="w-[200px]"
                            options={borrowerOptions}
                        // This adds the spinner to the right side of the dropdown box
                        // loading={processingBorrowers.size > 0}
                        />

                        {/* Optional: Keep this if you want an EXTRA spinner outside the box */}
                        {processingBorrowers.size > 0 && (
                            <Spin size="small" className="ml-1" />
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="px-6">
                    <h2 className="text-lg font-semibold text-Colors-Text-Primary-primary custom-font-jura mb-0">
                        {activeTab === "ruleResults" && "Underwriting Rule Results"}
                        {activeTab === "wageEarner" && "Underwriting Summary"}
                        {activeTab === "bankStatement" && "Bank Statement Analysis"}
                        {activeTab === "selfEmployed" && "Self Employed Analysis"}
                        {activeTab === "reo" && "Real Estate Owned (REO)"}
                        {activeTab === "insights" && "Insights"}
                    </h2>
                </div>

                {/* Summary Cards */}
                {activeTab === "ruleResults" && (
                    <div className="px-6 py-2 grid grid-cols-4 gap-4">
                        {ruleResultsCards.map((card, index) => (
                            <div
                                key={index}
                                className="bg-white border-2 border-gray-200 rounded-lg p-4 relative overflow-hidden"
                            >
                                <img
                                    src={Icons.analyticResult.Frame}
                                    alt=""
                                    className="absolute -top-2 right-0 w-25 pointer-events-none select-none"
                                />
                                <div className="flex items-center gap-2 mb-2">
                                    <img src={card.icon} alt="" />
                                    <span className="text-sm text-Colors-Text-Primary-primary custom-font-jura">
                                        {card.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-[#4D4D4D]">
                                    {card.count}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "wageEarner" && (
                    <div className="px-6 py-2 grid grid-cols-6 gap-4">
                        {wageEarnerCards.map((card, index) => (
                            <div
                                key={index}
                                className="bg-[#12699E] rounded-lg p-4 text-white relative overflow-hidden"
                            >
                                <img
                                    src={Icons.analyticResult.Frame}
                                    alt=""
                                    className="absolute -top-3 right-0 w-30 opacity-70 pointer-events-none select-none"
                                />
                                <div className="text-xs mb-1">{card.label}</div>
                                <div className="text-2xl font-bold">{card.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto min-h-0">
                    {!hasData && isCurrentBorrowerProcessing ? (
                        <div className="px-6 pb-4 flex items-center justify-center h-full">
                            <div className="text-center">
                                <Spin size="large" />
                                <p className="text-gray-500 mt-4">Processing {selectedBorrower}...</p>
                                <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
                            </div>
                        </div>
                    ) : !hasData ? (
                        <div className="px-6 pb-4 flex items-center justify-center h-full">
                            <div className="text-center text-gray-500">
                                <p>No analysis data available for this borrower yet.</p>
                                <p className="text-sm mt-2">Analysis may still be in progress.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === "ruleResults" && (
                                <div className="px-6 pb-4">
                                    <RuleResults rules={analyzedData[selectedBorrower]?.rules?.results} />
                                </div>
                            )}

                            {activeTab === "wageEarner" && (
                                <div className="px-6 pb-4">
                                    <WageEarner data={currentBorrowerData?.summary} />
                                </div>
                            )}

                            {activeTab === "bankStatement" && (
                                <div className="px-6 pb-4">
                                    <BankStatement data={currentBorrowerData?.bankStatement} />
                                </div>
                            )}

                            {activeTab === "selfEmployed" && (
                                <div className="px-6 pb-4">
                                    <div>{JSON.stringify(currentBorrowerData?.self_employee, null, 2)}</div>
                                </div>
                            )}

                            {activeTab === "reo" && (
                                <div className="px-6 pb-4">
                                    <div>{JSON.stringify(currentBorrowerData?.reo_summary, null, 2)}</div>
                                </div>
                            )}

                            {activeTab === "insights" && (
                                <div className="px-6 pb-4 whitespace-pre-line">
                                    <div>{currentBorrowerData?.insights || "No insights available"}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div
                    className="fixed bottom-7 right-6 z-50"
                    onClick={() => setIsRulesModalOpen(true)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: "#24A1DD",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                >
                    <img
                        src={Icons.analyticResult.scrollText}
                        alt="View Rules"
                        width={28}
                        height={28}
                        style={{
                            pointerEvents: "none",
                            filter: "brightness(0) invert(1)"
                        }}
                    />
                </div>

                <UnderWritingRulesModal
                    isOpen={isRulesModalOpen}
                    onClose={() => setIsRulesModalOpen(false)}
                />
            </div>
        </>
    );
}