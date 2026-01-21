import React, { useEffect, useMemo, useState } from "react";
import { Select, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CustomButton from "./components/CustomButton";
import ReusableDataTable from "./custom_components/ReusableDataTable";
import { Icons } from "./utils/icons";
import { getUserData } from "./utils/authService";
import axiosClient from "./api/axiosClient";
import { useUpload } from "./contexts/UploadContext";
import toast from "./utils/ToastService";
import { useNavigate } from "react-router-dom";


/* ================= STATUS FILTER ================= */
const STATUS_OPTIONS = [
    { label: "All Status", value: "ALL" },
    { label: "Pending", value: "Pending" },
    { label: "Completed", value: "Completed" },
    { label: "Error", value: "Error" },
];

export default function Home() {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loanData, setLoanData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { email } = getUserData() || {};

    const navigate = useNavigate();


    /* ================= LOAD DATA ================= */
    useEffect(() => {
        if (email) {
            handleCheckData();
        }
    }, [email]);


    /* ================= TRANSFORM API DATA ================= */
    const transformUploadedData = (rows = []) =>
        rows.map((item, index) => {
            const cleanBorrowers = Array.isArray(item.borrower)
                ? item.borrower.filter(b => b && b.trim() !== "")
                : typeof item.borrower === "string"
                    ? item.borrower.split(",").map(b => b.trim()).filter(Boolean)
                    : [];

            return {
                id: index,
                username: item.username,
                loanId: item.loanID,
                fileName: item.file_name,

                borrowers: [
                    ...cleanBorrowers.slice(0, 2),
                    cleanBorrowers.length > 2 ? `+${cleanBorrowers.length - 2}` : null
                ].filter(Boolean),

                allBorrowers: cleanBorrowers,

                status: item.analyzed_data ? "Completed" : "Pending",

                updatedAt: new Date(item.updated_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),

                uploadedBy: "-"
            };
        });


    /* ================= API CALL ================= */
    const handleCheckData = async () => {
        try {
            setLoading(true);

            const response = await axiosClient.post("/uploaded-data/by-email", { email });
            console.log('res', response);

            if (Array.isArray(response)) {
                setLoanData(transformUploadedData(response));
            } else {
                setLoanData([]);
            }
        } catch (err) {
            console.error("Error fetching uploaded data", err);
            setLoanData([]);
        } finally {
            setLoading(false);
        }
    };

    /* ================= CUSTOM SEARCH FUNCTION ================= */
    const handleSearch = (data, searchText) => {
        if (!searchText.trim()) return data;

        const query = searchText.toLowerCase();
        return data.filter(row => {
            // Search in loan ID
            if (row.loanId?.toLowerCase().includes(query)) return true;

            // Search in file name
            if (row.fileName?.toLowerCase().includes(query)) return true;

            // Search in ALL borrower names (including hidden ones)
            if (Array.isArray(row.allBorrowers)) {
                const hasBorrowerMatch = row.allBorrowers.some(name =>
                    name?.toLowerCase().includes(query)
                );
                if (hasBorrowerMatch) return true;
            }

            // Search in uploaded by
            if (row.uploadedBy?.toLowerCase().includes(query)) return true;

            return false;
        });
    };

    /* ================= FILTER BY STATUS ================= */
    const filteredData = useMemo(() => {
        if (statusFilter === "ALL") return loanData;
        return loanData.filter(row => row.status === statusFilter);
    }, [loanData, statusFilter]);

    /* ================= CELL RENDERERS ================= */

    const BorrowerNameCell = (params) => {
        const borrowers = params.value;
        if (!Array.isArray(borrowers)) return null;

        const allBorrowers = params.data?.allBorrowers || [];

        return (
            <div className="flex items-center gap-2 h-full overflow-hidden">
                {borrowers.map((name, idx) => {
                    const isMoreIndicator = typeof name === "string" && name.startsWith("+");

                    if (isMoreIndicator) {
                        const visibleBorrowers = borrowers.filter(b => !b.startsWith("+"));
                        const hiddenBorrowers = allBorrowers.slice(2);
                        const allNames = [...visibleBorrowers, ...hiddenBorrowers].join(", ");

                        return (
                            <Tooltip key={idx} title={`All borrowers: ${allNames}`} placement="top">
                                <span className="px-2 py-1 bg-[#4D4D4D] text-white text-xs rounded-full font-medium whitespace-nowrap max-w-[50px] overflow-hidden text-ellipsis">
                                    {name}
                                </span>
                            </Tooltip>
                        );
                    }

                    return (
                        <Tooltip key={idx} title={name} placement="top">
                            <span className="px-2 py-1 bg-[#E6E6E6] text-[#4D4D4D] text-xs rounded-full font-medium whitespace-nowrap max-w-[90px] overflow-hidden text-ellipsis">
                                {name}
                            </span>
                        </Tooltip>
                    );
                })}
            </div>
        );
    };

    const StatusCell = (params) => {
        const value = params.value;
        const statusMap = {
            Pending: "border-[#F5B800] text-[#F5B800]",
            Completed: "border-[#22C55E] text-[#22C55E]",
            Error: "border-[#EF4444] text-[#EF4444]",
        };

        return (
            <div className="flex items-center">
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${statusMap[value] || "border-gray-300 text-gray-500"
                        }`}
                >
                    {value}
                </span>
            </div>
        );
    };

    const LoanActionCell = (params) => {
        const handleViewClick = () => {
            const rowData = params.data;


            navigate(`/income-analyzer/${rowData.loanId}`);

        };

        return (
            <div className="flex items-center justify-center">
                <button
                    className="cursor-pointer hover:opacity-80"
                    title="View"
                    onClick={handleViewClick}
                >
                    <img
                        src={Icons.loanDocument.eye}
                        alt="View"
                        className="w-4 h-4"
                    />
                </button>
            </div>
        );
    };

    /* ================= COLUMNS ================= */
    const columnDefs = [
        {
            field: "loanId",
            headerName: "Loan ID",
            // width: 180,
            flex: 1,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        {
            field: "username",
            headerName: "User Name",
            // width: 160,
            flex: 1,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        // {
        //     field: "fileName",
        //     headerName: "File Name",
        //     // width: 200,
        //     flex: 1,
        //     cellStyle: { display: 'flex', alignItems: 'center' }
        // },
        {
            field: "fileName",
            headerName: "File Name",
            flex: 1,
            cellRenderer: (params) => {
                const value = params.value;

                if (!value) return "-";

                return (
                    <Tooltip title={value} placement="topLeft">
                        <span
                            className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                        >
                            {value}
                        </span>
                    </Tooltip>
                );
            },
            cellStyle: {
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }
        },
        {
            field: "borrowers",
            headerName: "Borrower Name",
            // width: 320,
            minWidth: 140,
            flex: 2,
            cellRenderer: BorrowerNameCell,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '8px 12px' }
        },
        {
            field: "status",
            headerName: "Status",
            // width: 140,
            minWidth: 110,
            flex: 1,
            sortable: false,
            cellRenderer: StatusCell,
            cellStyle: { display: 'flex', alignItems: 'center' },
            suppressSizeToFit: true
        },
        {
            field: "updatedAt",
            headerName: "Last Updated",
            // width: 180,
            flex: 1,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },

        {
            headerName: "Actions",
            width: 100,
            flex: 0,
            pinned: "right",
            lockPinned: true,
            sortable: false,
            filter: false,
            suppressMovable: true,
            cellRenderer: LoanActionCell,
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
        },
    ];

    /* ================= UI ================= */
    return (
        <div className="min-h-screen bg-slate-50 p-6">

            {/* ===== TOP BAR ===== */}
            <div className=" py-3 mb-4">
                <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-4">
                        <span className="text-[26px] font-semibold custom-font-jura">Processed Loans</span>

                        <div className="relative w-[250px]">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-sm border bg-white outline-none rounded-md"
                            />
                            <img
                                src={Icons.processedLoans.search}
                                alt="search"
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60"
                            />
                        </div>

                        <Select
                            value={statusFilter}
                            options={STATUS_OPTIONS}
                            onChange={setStatusFilter}
                            className="w-[130px] !bg-transparent !h-9"
                        />
                    </div>
                    <div>
                        <CustomButton variant="primary" className="h-9 px-4" onClick={() => {
                            navigate('/income-analyzer')
                        }}>
                            <PlusOutlined />
                            <span className="ml-1">Add Loan Package</span>
                        </CustomButton>
                    </div>
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <ReusableDataTable
                title=""
                columnDefs={columnDefs}
                data={filteredData}
                loading={loading}
                tableHeader={false}
                tableSearch={false}
                defaultPageSize={10}
                rowHeight={60}
                // Pass search props to table
                onSearch={handleSearch}
                searchText={searchQuery}
            />
        </div>
    );
}