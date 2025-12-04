import React, { useCallback, useMemo } from "react";
import "antd/dist/reset.css";
import { useNavigate } from "react-router-dom";

const SignupRequestSubmittedPage = () => {
    const navigate = useNavigate();

    const bgStyle = useMemo(
        () => ({ backgroundImage: `url('/auth_page_bg.png')` }),
        []
    );

    const handleBackToLogin = useCallback(() => {
        navigate("/");
    }, [navigate]);

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-no-repeat"
            style={bgStyle}
        >
            {/* white curve */}
            <div className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-[130%] rounded-[50%] bg-slate-100" />

            {/* background circles */}
            <div className="pointer-events-none absolute -left-40 -top-24 h-96 w-96 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-white/15" />

            {/* card */}
            <div className="relative z-10 w-[527px] rounded-xl bg-white px-8 py-8 shadow-2xl">
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
                        Sign Up Request Submitted!
                    </div>

                    <div className="mt-3 text-xs font-creato text-base-lightest-custom leading-4">
                        Your sign-up request has been sent to the platform admin for review.
                        <br />
                        You&apos;ll be notified once it&apos;s approved.
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="text-Colors-Text-Primary-primary text-sm font-creato font-medium leading-4"
                    >
                        Back to Log In
                    </button>
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

export default React.memo(SignupRequestSubmittedPage);
