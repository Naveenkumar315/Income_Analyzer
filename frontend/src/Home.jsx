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
        rows.map((item, index) => ({
            id: index,
            username: item.username,
            loanId: item.loanID,
            fileName: item.file_name,

            borrowers: Array.isArray(item.borrower)
                ? [
                    ...(item.borrower.slice(0, 2)),
                    item.borrower.length > 2
                        ? `+${item.borrower.length - 2}`
                        : null,
                ].filter(Boolean)
                : [],

            // Store all borrowers for search
            allBorrowers: Array.isArray(item.borrower) ? item.borrower : [],

            status: item.analyzed_data ? "Completed" : "Pending",


            updatedAt: new Date(item.updated_at).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }),

            uploadedBy: "-", // backend not sending this yet
        }));

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

        // Get all borrowers from row data
        const allBorrowers = params.data?.allBorrowers || [];

        return (
            <div className="flex items-center gap-2 flex-wrap h-full">
                {borrowers.map((name, idx) => {
                    // Check if this is the "+N" indicator
                    const isMoreIndicator = typeof name === 'string' && name.startsWith('+');

                    if (isMoreIndicator) {
                        // Show tooltip with all borrowers on the +N tag
                        const visibleBorrowers = borrowers.filter(b => !b.startsWith('+'));
                        const hiddenBorrowers = allBorrowers.slice(2);
                        const allNames = [...visibleBorrowers, ...hiddenBorrowers].join(', ');

                        return (
                            <Tooltip key={idx} title={`All borrowers: ${allNames}`} placement="top">
                                <span className="px-3 py-1 bg-[#4D4D4D] text-white text-xs rounded-full font-medium whitespace-nowrap cursor-help">
                                    {name}
                                </span>
                            </Tooltip>
                        );
                    }

                    return (
                        <Tooltip key={idx} title={name} placement="top">
                            <span className="px-3 py-1 bg-[#E6E6E6] text-[#4D4D4D] text-xs rounded-full font-medium whitespace-nowrap cursor-default">
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

            // Check if analysis is completed
            if (rowData.status !== "Completed") {
                toast.warning("Analysis is not completed yet for this loan");
                return;
            }

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
            width: 180,
            flex: 0,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        {
            field: "username",
            headerName: "User Name",
            width: 160,
            flex: 0,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        {
            field: "fileName",
            headerName: "File Name",
            width: 200,
            flex: 0,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        {
            field: "borrowers",
            headerName: "Borrower Name",
            width: 320,
            flex: 0,
            cellRenderer: BorrowerNameCell,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '8px 12px' }
        },
        {
            field: "status",
            headerName: "Status",
            width: 140,
            flex: 0,
            sortable: false,
            cellRenderer: StatusCell,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },
        {
            field: "updatedAt",
            headerName: "Last Updated",
            width: 180,
            flex: 0,
            cellStyle: { display: 'flex', alignItems: 'center' }
        },

        {
            headerName: "Actions",
            width: 100,
            flex: 0,
            pinned: "right",
            lockPinned: true,
            suppressMovable: true,
            cellRenderer: LoanActionCell,
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
        },
    ];

    /* ================= UI ================= */
    return (
        <div className="min-h-screen bg-slate-50 p-6">

            {/* ===== TOP BAR ===== */}
            <div className="px-4 py-3 mb-4">
                <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-4">
                        <h1 className="text-[24px] font-semibold custom-font-jura">
                            Processed Loans
                        </h1>

                        <div className="relative w-[220px]">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-sm border rounded-md"
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
                            className="w-[130px]"
                        />
                    </div>
                    <div>
                        <CustomButton variant="primary" className="h-9 px-4">
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