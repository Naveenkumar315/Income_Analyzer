
/* -------- Value formatter -------- */
const formatValue = (value) => {
    if (value === null || value === undefined) return "—";

    const num = Number(value);
    if (Number.isNaN(num)) return value;

    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/* -------- Amount color -------- */
const getAmountColor = (value) => {
    const num = Number(value);

    if (Number.isNaN(num)) return "text-gray-400";
    if (num < 0) return "text-red-600";

    return "text-[#12B7A1]"; // green (same tone as your Pass color)
};

const BankStatement = ({ data = [] }) => {
    if (!data.length) {
        return (
            <div className="p-6 text-gray-500 text-center">
                No bank statement insights available
            </div>
        );
    }

    return (
        <div className="space-y-4">

            <div className="space-y-3">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-start justify-between border border-gray-200 rounded-lg bg-white px-4 py-3"
                    >
                        {/* Left */}
                        <div className="space-y-1 max-w-[80%]">
                            <p className=" font-medium text-gray-900 custom-font-jura">
                                {item.field}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {item.commentary}
                            </p>
                        </div>

                        {/* Right (Amount) */}
                        <div
                            className={`text-sm font-semibold ${item.value
                                }`}
                        >
                            {formatValue(item.value)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BankStatement;
