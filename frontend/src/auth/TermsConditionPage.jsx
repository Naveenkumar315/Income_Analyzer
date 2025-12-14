import React, { useState, useCallback, useMemo } from "react";
import { Checkbox } from "antd";
import "antd/dist/reset.css";

import CustomButton from "../components/CustomButton";

const TermsConditionPage = ({ onAccesptTerms }) => {
    const [accepted, setAccepted] = useState(false);

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

    const handleCheckboxChange = useCallback((e) => {
        setAccepted(e.target.checked);
    }, []);

    const handleGetStarted = useCallback(() => {
        if (!accepted) return;
        if (onAccesptTerms) onAccesptTerms();
    }, [accepted, onAccesptTerms]);

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-no-repeat"
            style={bgStyle}
        >
            {/* white curve */}
            <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" />

            {/* background circles */}
            {/* <div className="pointer-events-none absolute -left-40 -top-24 h-96 w-96 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-white/15" /> */}

            {/* card */}
            <div className="relative z-10 w-[360px] rounded-xl bg-white px-8 py-8 shadow-md">
                {/* logo */}
                <div className="mb-4 flex items-center justify-center gap-2 w-full">
                    <img src="/dna-strand.svg" alt="" className="h-6 w-6" />
                    <div className="flex items-center">
                        <span className="text-gray-800 text-xl font-extrabold font-creato uppercase leading-7">
                            Income
                        </span>
                        <span className="text-sky-500 text-xl font-extrabold font-creato uppercase leading-7 ml-1">
                            Analyzer
                        </span>
                    </div>
                </div>

                {/* headings */}
                <div className="text-center">
                    <div className="text-Colors-Text-Base-base text-2xl font-bold custom-font-jura leading-8">
                        Email Address Verified!
                    </div>

                    <div className="text-base-lightest-custom mt-2 text-sm font-creato leading-4">
                        Your email address has been successfully verified.
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-creato leading-4">
                        <Checkbox checked={accepted} onChange={handleCheckboxChange} />
                        <label
                            onClick={() => setAccepted(!accepted)}
                            className="text-base-custom cursor-pointer"
                        >
                            I accept the{" "}
                            <button
                                type="button"
                                className="text-Colors-Text-Primary-primary underline-offset-2 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Terms and Conditions
                            </button>
                        </label>
                    </div>

                    <CustomButton
                        variant={accepted ? "primary" : "disabled"}
                        type="button"
                        className={`mt-0 ${accepted ? "cursor-pointer" : "!cursor-not-allowed"}`}
                        onClick={handleGetStarted}
                    >
                        Get Started
                        <img
                            src={
                                accepted ? "/arrow-right-active.png" : "/arrow-right.svg"
                            }
                            alt=""
                            className="w-4 h-4"
                        />
                    </CustomButton>
                </div>
            </div>

            <img
                src="/loandna_logo.png"
                alt="Brand Logo"
                className="pointer-events-none absolute bottom-8 right-12 z-10 h-10 w-auto"
            />
        </div>
    );
};

export default React.memo(TermsConditionPage);
