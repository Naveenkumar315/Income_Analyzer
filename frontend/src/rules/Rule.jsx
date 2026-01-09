import RulesList from "./RulesList";

const Rule = () => {
    return (
        <div className="p-6 bg-gray-50 h-[calc(100vh-48px)] overflow-y-auto">
            <div className="w-full max-w-7xl 2xl:max-w-none mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">

                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h4 className="text-2xl text-gray-900 custom-font-jura">Rules</h4>
                </div>

                <div className="p-2 ">
                    <RulesList />
                </div>

            </div>
        </div>
    );
};

export default Rule;
