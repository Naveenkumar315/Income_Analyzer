// AdminTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    SearchOutlined,
} from "@ant-design/icons";
import authApi from "../../api/authApi";
import { toast } from "react-toastify";
import FilterIcon from "../../assets/icons/Filter.svg";

export default function AdminTable() {
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState("");
    const [gridApi, setGridApi] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await authApi.getAllUsers();
            const transformedData = transformUserData(response.users);
            setUsers(transformedData);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // Transform user data to table format
    const transformUserData = (users) => {
        return users.map((user) => {
            let name, email, phone, companyType, companySize;

            if (user.type === "individual") {
                // Individual user
                const info = user.individualInfo || {};
                name = `${info.firstName || ""} ${info.lastName || ""}`.trim();
                email = info.email || user.email;
                phone = info.phone || "";
                companyType = "Broker";
                companySize = "1";
            } else if (user.type === "company") {
                // Company user
                const companyInfo = user.companyInfo || {};

                name = companyInfo.companyName || "";
                email = companyInfo.companyEmail || user.email;
                phone = companyInfo.companyPhone || "";

                companyType = "Broker Company";
                companySize = companyInfo.companySize || "-";
            } else {
                // Fallback for unknown type
                name = user.username || "-";
                email = user.email;
                phone = "-";
                companyType = "-";
                companySize = "-";
            }

            return {
                id: user._id,
                name,
                email,
                phone,
                submittedOn: user.created_at ? new Date(user.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : "-",
                approvedOn: user.approvedOn ? new Date(user.approvedOn).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : "-",
                companyType,
                companySize,
                status: user.status || "pending",
                isActive: user.status === "active"
            };
        });
    };

    // Handle approve action
    const handleApprove = async (userId) => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to approve this user?")) {
            try {
                await authApi.updateUserStatus(userId, "active");
                toast.success("User approved successfully");
                // Refresh users list
                await fetchUsers();
            } catch (error) {
                console.error("Error approving user:", error);
                toast.error("Failed to approve user");
            }
        }
    };

    // Handle reject action
    const handleReject = async (userId) => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to reject this user?")) {
            try {
                await authApi.updateUserStatus(userId, "inactive");
                toast.success("User rejected successfully");
                // Refresh users list
                await fetchUsers();
            } catch (error) {
                console.error("Error rejecting user:", error);
                toast.error("Failed to reject user");
            }
        }
    };

    // Handle delete action
    const handleDelete = async (userId) => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            try {
                await authApi.deleteUser(userId);
                toast.success("User deleted successfully");
                // Refresh users list
                await fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.error("Failed to delete user");
            }
        }
    };

    // Handle status toggle for approved/rejected users
    const handleStatusToggle = async (userId, newStatus) => {
        try {
            await authApi.updateUserStatus(userId, newStatus);
            toast.success(`User status updated to ${newStatus}`);
            // Refresh users list
            await fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    useEffect(() => {
        // Load AG Grid CSS
        const cssLinks = [
            'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-grid.css',
            'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-theme-alpine.css'
        ];

        cssLinks.forEach(href => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        });

        // Load AG Grid JS
        if (!window.agGrid) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/dist/ag-grid-community.min.js';
            script.onload = () => {
                console.log('AG Grid loaded');
                setIsLoaded(true);
            };
            script.onerror = () => {
                console.error('Failed to load AG Grid');
            };
            document.body.appendChild(script);
        } else {
            setIsLoaded(true);
        }

        // Fetch users on mount
        fetchUsers();
    }, []);

    const columnDefs = useMemo(
        () => [
            {
                field: "name",
                headerName: "Full Name",
                width: 180,
                filter: true,
                sortable: true
            },
            {
                field: "email",
                headerName: "Email",
                width: 220,
                filter: true,
                sortable: true
            },
            {
                field: "phone",
                headerName: "Phone Number",
                width: 150,
                filter: true,
                sortable: true
            },
            {
                field: "status",
                headerName: "Status",
                width: 120,
                sortable: true,
                cellRenderer: (params) => {
                    const isActive = params.data.isActive;
                    const isPending = params.data.status === "pending";

                    return `
                        <div style="display: flex; align-items: center; height: 100%; padding-left: 8px;">
                            <label style="position: relative; display: inline-block; width: 48px; height: 24px;">
                                <input 
                                    type="checkbox" 
                                    ${isActive ? 'checked' : ''}
                                    class="status-toggle" 
                                    data-id="${params.data.id}"
                                    data-status="${params.data.status}"
                                    style="opacity: 0; width: 0; height: 0;"
                                />
                                <span style="
                                    position: absolute;
                                    cursor: pointer;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background-color: ${isActive ? '#3b82f6' : '#cbd5e1'};
                                    transition: 0.3s;
                                    border-radius: 24px;
                                ">
                                    <span style="
                                        position: absolute;
                                        content: '';
                                        height: 18px;
                                        width: 18px;
                                        left: ${isActive ? '27px' : '3px'};
                                        bottom: 3px;
                                        background-color: white;
                                        transition: 0.3s;
                                        border-radius: 50%;
                                    "></span>
                                </span>
                            </label>
                            <span style="margin-left: 8px; font-size: 13px; color: #64748b;">
                                ${isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    `;
                },
                cellStyle: {
                    display: "flex",
                    alignItems: "center"
                }
            },
            {
                field: "submittedOn",
                headerName: "Submitted On",
                width: 180,
                filter: true,
                sortable: true
            },
            {
                field: "approvedOn",
                headerName: "Approved / Rejected On",
                width: 180,
                filter: true,
                sortable: true
            },
            {
                field: "companyType",
                headerName: "Company Type",
                width: 140,
                filter: true,
                sortable: true
            },
            {
                field: "companySize",
                headerName: "Company Size",
                width: 130,
                filter: true,
                sortable: true,
                cellStyle: { textAlign: "center" }
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 200,
                pinned: "right",
                cellRenderer: (params) => {
                    const isPending = params.data.status === "pending";

                    if (isPending) {
                        // Show Approve and Reject buttons for pending users
                        return `
                            <div style="display: flex; gap: 8px; justify-content: center; align-items: center; height: 100%;">
                                <button 
                                    class="approve-btn" 
                                    data-id="${params.data.id}"
                                    style="
                                        background: #16a34a;
                                        color: white;
                                        border: none;
                                        border-radius: 50%;
                                        width: 32px;
                                        height: 32px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 16px;
                                        transition: all 0.2s;
                                    "
                                    onmouseover="this.style.background='#15803d'"
                                    onmouseout="this.style.background='#16a34a'"
                                    title="Approve"
                                >
                                    ✓
                                </button>
                                <button 
                                    class="reject-btn" 
                                    data-id="${params.data.id}"
                                    style="
                                        background: #dc2626;
                                        color: white;
                                        border: none;
                                        border-radius: 50%;
                                        width: 32px;
                                        height: 32px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 16px;
                                        transition: all 0.2s;
                                    "
                                    onmouseover="this.style.background='#b91c1c'"
                                    onmouseout="this.style.background='#dc2626'"
                                    title="Reject"
                                >
                                    ✗
                                </button>
                                <button 
                                    class="delete-btn" 
                                    data-id="${params.data.id}"
                                    style="
                                        background: #dc2626;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 6px 12px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 6px;
                                        font-size: 13px;
                                        transition: all 0.2s;
                                    "
                                    onmouseover="this.style.background='#b91c1c'"
                                    onmouseout="this.style.background='#dc2626'"
                                    title="Delete User"
                                >
                                    🗑️ Delete User
                                </button>
                            </div>
                        `;
                    } else {
                        // Show only Delete button for approved/rejected users
                        return `
                            <div style="display: flex; gap: 8px; justify-content: center; align-items: center; height: 100%;">
                                <button 
                                    class="delete-btn" 
                                    data-id="${params.data.id}"
                                    style="
                                        background: #dc2626;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 6px 12px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 6px;
                                        font-size: 13px;
                                        transition: all 0.2s;
                                    "
                                    onmouseover="this.style.background='#b91c1c'"
                                    onmouseout="this.style.background='#dc2626'"
                                    title="Delete User"
                                >
                                    🗑️ Delete User
                                </button>
                            </div>
                        `;
                    }
                },
                cellStyle: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }
            }
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchText) return users;

        const search = searchText.toLowerCase();
        return users.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(search)
            )
        );
    }, [users, searchText]);

    useEffect(() => {
        if (isLoaded && gridRef.current && window.agGrid && !gridApi) {
            console.log('Initializing grid...');

            const gridOptions = {
                columnDefs: columnDefs,
                rowData: filteredData,
                defaultColDef: {
                    resizable: true,
                    suppressMenu: true
                },
                pagination: true,
                paginationPageSize: pageSize,
                suppressPaginationPanel: true,
                domLayout: 'normal',
                rowHeight: 48,
                headerHeight: 48,
                suppressCellFocus: true,
                onGridReady: (params) => {
                    console.log('Grid ready');
                    setGridApi(params.api);
                    params.api.addEventListener('paginationChanged', () => {
                        setCurrentPage(params.api.paginationGetCurrentPage() + 1);
                    });
                },
                onCellClicked: (event) => {
                    const target = event.event.target;

                    // Approve button clicked
                    if (target.classList && target.classList.contains("approve-btn")) {
                        const id = target.dataset.id;
                        event.event.preventDefault();
                        handleApprove(id);
                        return;
                    }

                    // Reject button clicked
                    if (target.classList && target.classList.contains("reject-btn")) {
                        const id = target.dataset.id;
                        event.event.preventDefault();
                        handleReject(id);
                        return;
                    }

                    // Delete button clicked
                    if (target.classList && target.classList.contains("delete-btn")) {
                        const id = target.dataset.id;
                        event.event.preventDefault();
                        handleDelete(id);
                        return;
                    }

                    // Status toggle clicked
                    if (target.classList && target.classList.contains("status-toggle")) {
                        const id = target.dataset.id;
                        const currentStatus = target.dataset.status;
                        const user = users.find(u => u.id === id);

                        if (user) {
                            event.event.preventDefault();

                            if (user.status === "pending") {
                                // For pending users, trigger approval
                                handleApprove(id);
                            } else {
                                // For approved/rejected users, toggle between active and inactive
                                const newStatus = user.isActive ? "inactive" : "active";
                                handleStatusToggle(id, newStatus);
                            }
                        }
                        return;
                    }
                }
            };

            window.agGrid.createGrid(gridRef.current, gridOptions);
        }
    }, [isLoaded, columnDefs, filteredData, gridApi, pageSize]);

    // Update grid rows when filteredData changes
    useEffect(() => {
        if (gridApi) {
            try {
                gridApi.setRowData(filteredData);
            } catch (err) {
                // fallback for older ag-grid versions
                gridApi.setGridOption && gridApi.setGridOption('rowData', filteredData);
            }
        }
    }, [filteredData, gridApi]);

    if (!isLoaded || loading) {
        return (
            <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
                <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: "0px 24px", background: "#f8fafc", minHeight: "100dvh" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                // justifyContent: "space-between",
                gap: "24px",
                alignItems: "center",
                marginBottom: 24
            }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }} className="custom-font-jura">
                    User Management
                </h2>
                <span style={{
                    display: "flex",
                    padding: "4px",
                    width: '60px',
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "stretch",
                    borderRadius: "999px",
                    background: "#E0E0E0"
                }}>
                    {filteredData.length}
                </span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div
                        style={{
                            position: "relative",
                            width: 360,
                            borderRadius: "8px",
                            border: "1px solid #E0E0E0",
                            background: "#fff",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.06);",
                        }}
                    >
                        <SearchOutlined
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: 14,
                                transform: "translateY(-50%)",
                                color: "#4D4D4D",
                            }}
                        />
                        <input
                            placeholder="Search loan, borrower etc."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="custom-font-jura"
                            style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                padding: "10px 14px 10px 42px",
                                borderRadius: 8,
                                fontSize: 15,
                            }}
                        />
                    </div>

                    {/* Filter Button */}
                    <button
                        className="custom-font-jura"
                        style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "10px 16px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: 15,
                            color: "#303030"
                        }}>
                        <img src={FilterIcon} alt="Filter" />
                        Filter
                    </button>
                </div>

                {/* All Filter Chip */}
                <div style={{
                    background: "#E0E0E0",
                    justifyContent: 'center',
                    borderRadius: "999px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}>
                    <span
                        className="custom-font-jura"
                        style={{
                            color: "#303030",
                            textAlign: 'center',
                            fontSize: "normal",
                            fontWeight: 400,
                            lineHeight: '18px'
                        }}>All</span>
                    <button className="custom-font-jura" style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        fontSize: 16,
                        padding: 0,
                        display: "flex",
                        alignItems: "center"
                    }}>✕</button>
                </div>
            </div>

            {/* AG Grid */}
            <div style={{
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                border: "1px solid #eee",
                background: 'white'
            }}>
                <style>{`
          .ag-theme-alpine .ag-header {
            background: #0369a1 !important;
            border-bottom: 1px solid #075985;
          }
          .ag-theme-alpine .ag-header-cell {
            color: white !important;
            font-weight: 600;
          }
          .ag-theme-alpine .ag-header-cell-text {
            color: white !important;
          }
          .ag-theme-alpine .ag-header-icon {
            color: white !important;
          }
          .ag-theme-alpine .ag-row-even {
            background: white;
          }
          .ag-theme-alpine .ag-row-odd {
            background: #f9fafb;
          }
          .ag-theme-alpine .ag-row-hover {
            background: #eff6ff !important;
          }
          .ag-theme-alpine .ag-cell {
            border-bottom: 1px solid #f1f5f9;
          }
          .ag-theme-alpine .ag-pinned-right-header {
            border-left: 1px solid #075985;
          }
          .ag-theme-alpine .ag-pinned-right-cols-container .ag-cell {
            border-left: 1px solid #eee;
          }
          .ag-theme-alpine .ag-root-wrapper {
            border: none;
          }
        `}</style>
                <div
                    ref={gridRef}
                    className="ag-theme-alpine"
                    style={{ height: 450, width: '100%' }}
                />

                {/* Custom Pagination */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #e5e7eb',
                    background: 'white'
                }}>
                    {/* Left Side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: 500
                        }}>Items per page:</span>

                        <div style={{ position: 'relative' }}>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                    if (gridApi) {
                                        gridApi.paginationSetPageSize(newSize);
                                        gridApi.paginationGoToPage(0);
                                    }
                                }}
                                style={{
                                    appearance: 'none',
                                    padding: '6px 32px 6px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    minWidth: '70px',
                                    color: '#374151'
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                fontSize: '12px',
                                color: '#6b7280'
                            }}>▼</span>
                        </div>

                        <span style={{
                            fontSize: '14px',
                            color: '#9ca3af',
                            marginLeft: '8px'
                        }}>
                            {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} items
                        </span>
                    </div>

                    {/* Right Side - Page Numbers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(() => {
                            const totalPages = Math.ceil(filteredData.length / pageSize);
                            const pages = [];

                            // Always show first page
                            pages.push(1);

                            // Show pages around current page
                            if (currentPage > 3) {
                                pages.push('...');
                            }

                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                if (!pages.includes(i)) {
                                    pages.push(i);
                                }
                            }

                            // Show ellipsis before last page if needed
                            if (currentPage < totalPages - 2) {
                                pages.push('...');
                            }

                            // Always show last page if more than 1 page
                            if (totalPages > 1 && !pages.includes(totalPages)) {
                                pages.push(totalPages);
                            }

                            return pages.map((page, idx) => {
                                if (page === '...') {
                                    return (
                                        <span key={`ellipsis-${idx}`} style={{
                                            padding: '6px 8px',
                                            fontSize: '14px',
                                            color: '#9ca3af'
                                        }}>...</span>
                                    );
                                }

                                const isFirstThree = page <= 3;
                                const isActive = currentPage === page;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => {
                                            setCurrentPage(page);
                                            if (gridApi) {
                                                gridApi.paginationGoToPage(page - 1);
                                            }
                                        }}
                                        style={{
                                            minWidth: '36px',
                                            height: '36px',
                                            padding: '6px 12px',
                                            fontSize: '14px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: isActive ? '#3b82f6' : (isFirstThree ? '#e0f2fe' : 'transparent'),
                                            color: isActive ? 'white' : '#374151',
                                            cursor: 'pointer',
                                            fontWeight: isActive ? 600 : 400,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.target.style.background = isFirstThree ? '#bae6fd' : '#f3f4f6';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.target.style.background = isFirstThree ? '#e0f2fe' : 'transparent';
                                            }
                                        }}
                                    >
                                        {page}
                                    </button>
                                );
                            });
                        })()}

                        {/* Navigation Arrows */}
                        <div style={{
                            width: '1px',
                            height: '24px',
                            background: '#e5e7eb',
                            margin: '0 8px'
                        }} />

                        <button
                            onClick={() => {
                                if (currentPage > 1) {
                                    const newPage = currentPage - 1;
                                    setCurrentPage(newPage);
                                    if (gridApi) {
                                        gridApi.paginationGoToPage(newPage - 1);
                                    }
                                }
                            }}
                            disabled={currentPage === 1}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                color: currentPage === 1 ? '#d1d5db' : '#374151',
                                fontSize: '24px',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            ‹
                        </button>

                        <button
                            onClick={() => {
                                const totalPages = Math.ceil(filteredData.length / pageSize);
                                if (currentPage < totalPages) {
                                    const newPage = currentPage + 1;
                                    setCurrentPage(newPage);
                                    if (gridApi) {
                                        gridApi.paginationGoToPage(newPage - 1);
                                    }
                                }
                            }}
                            disabled={currentPage === Math.ceil(filteredData.length / pageSize)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: currentPage === Math.ceil(filteredData.length / pageSize) ? 'not-allowed' : 'pointer',
                                color: currentPage === Math.ceil(filteredData.length / pageSize) ? '#d1d5db' : '#374151',
                                fontSize: '24px',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
