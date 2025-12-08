// AdminTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    SearchOutlined,
} from "@ant-design/icons";

const API_BASE_URL = "http://localhost:8080";

export default function AdminTable() {
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState("");
    const [gridApi, setGridApi] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRows, setEditingRows] = useState({}); // Track which rows are in edit mode
    const [statusValues, setStatusValues] = useState({}); // Track status values for each row

    // Fetch users from API
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/users/admin-table`);
            const data = await response.json();

            if (data.users) {
                setUsers(data.users);
                // Initialize status values
                const initialStatuses = {};
                data.users.forEach(user => {
                    initialStatuses[user._id] = user.status || "pending";
                });
                setStatusValues(initialStatuses);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (userId) => {
        setEditingRows(prev => ({ ...prev, [userId]: true }));
    };

    const handleCloseClick = (userId, originalStatus) => {
        setEditingRows(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
        });
        // Revert to original status
        setStatusValues(prev => ({ ...prev, [userId]: originalStatus }));
    };

    const handleUpdateClick = async (userId) => {
        try {
            const newStatus = statusValues[userId];
            const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                console.log("Status updated successfully");
                // Exit edit mode
                setEditingRows(prev => {
                    const newState = { ...prev };
                    delete newState[userId];
                    return newState;
                });
                // Refresh data
                await fetchUsers();
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDeleteClick = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                console.log("User deleted successfully");
                await fetchUsers();
            } else {
                console.error("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleStatusChange = (userId, newStatus) => {
        setStatusValues(prev => ({ ...prev, [userId]: newStatus }));
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
    }, []);

    const columnDefs = useMemo(
        () => [
            {
                field: "email",
                headerName: "Email",
                width: 250,
                cellRenderer: (params) => {
                    return `<a href="mailto:${params.value}" style="color: #2563eb; text-decoration: none;">${params.value}</a>`;
                },
                filter: true,
                sortable: true
            },
            {
                field: "type",
                headerName: "Type",
                width: 150,
                filter: true,
                sortable: true,
                valueFormatter: (params) => params.value || "-"
            },
            {
                field: "companyInfo.companyName",
                headerName: "Company Name",
                width: 200,
                filter: true,
                sortable: true,
                valueGetter: (params) => {
                    return params.data.companyInfo?.companyName ||
                        (params.data.individualInfo ?
                            `${params.data.individualInfo.firstName} ${params.data.individualInfo.lastName}` :
                            "-");
                }
            },
            {
                field: "companyInfo.companyPhone",
                headerName: "Phone",
                width: 150,
                filter: true,
                sortable: true,
                valueGetter: (params) => {
                    return params.data.companyInfo?.companyPhone ||
                        params.data.individualInfo?.phone ||
                        "-";
                }
            },
            {
                field: "created_at",
                headerName: "Submitted On",
                width: 180,
                filter: true,
                sortable: true,
                valueFormatter: (params) => {
                    if (!params.value) return "-";
                    const date = new Date(params.value);
                    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
                }
            },
            // === STATUS COLUMN WITH DROPDOWN ===
            {
                field: "status",
                headerName: "Status",
                width: 350,
                pinned: "right",
                cellRenderer: (params) => {
                    const userId = params.data._id;
                    const currentStatus = statusValues[userId] || params.value || "pending";
                    const isEditing = editingRows[userId];
                    const originalStatus = params.value || "pending";

                    return `
                        <div style="display: flex; gap: 8px; align-items: center; height: 100%; padding: 4px 0;">
                            <select 
                                class="status-dropdown" 
                                data-user-id="${userId}"
                                ${!isEditing ? 'disabled' : ''}
                                style="
                                    padding: 4px 8px;
                                    border: 1px solid ${!isEditing ? '#e5e7eb' : '#d1d5db'};
                                    border-radius: 4px;
                                    background: ${!isEditing ? '#f9fafb' : 'white'};
                                    cursor: ${!isEditing ? 'not-allowed' : 'pointer'};
                                    font-size: 14px;
                                    color: ${!isEditing ? '#9ca3af' : '#374151'};
                                    flex: 1;
                                    max-width: 120px;
                                "
                            >
                                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>Active</option>
                                <option value="reject" ${currentStatus === 'reject' ? 'selected' : ''}>Reject</option>
                            </select>

                            ${!isEditing ? `
                                <button 
                                    class="edit-btn" 
                                    data-user-id="${userId}"
                                    style="
                                        padding: 4px 12px;
                                        background: #3b82f6;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 500;
                                    "
                                >
                                    Edit
                                </button>
                            ` : `
                                <button 
                                    class="update-btn" 
                                    data-user-id="${userId}"
                                    style="
                                        padding: 4px 12px;
                                        background: #10b981;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 500;
                                    "
                                >
                                    Update
                                </button>
                                <button 
                                    class="close-btn" 
                                    data-user-id="${userId}"
                                    data-original-status="${originalStatus}"
                                    style="
                                        padding: 4px 12px;
                                        background: #6b7280;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 500;
                                    "
                                >
                                    Close
                                </button>
                            `}

                            <button 
                                class="delete-btn" 
                                data-user-id="${userId}"
                                style="
                                    padding: 4px 12px;
                                    background: #ef4444;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 13px;
                                    font-weight: 500;
                                "
                            >
                                Delete
                            </button>
                        </div>
                    `;
                },
                cellStyle: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "0 8px"
                }
            }
        ],
        [editingRows, statusValues]
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

                    // Edit button clicked
                    if (target.classList && target.classList.contains("edit-btn")) {
                        const userId = target.dataset.userId;
                        handleEditClick(userId);
                        event.event.preventDefault();
                        return;
                    }

                    // Update button clicked
                    if (target.classList && target.classList.contains("update-btn")) {
                        const userId = target.dataset.userId;
                        handleUpdateClick(userId);
                        event.event.preventDefault();
                        return;
                    }

                    // Close button clicked
                    if (target.classList && target.classList.contains("close-btn")) {
                        const userId = target.dataset.userId;
                        const originalStatus = target.dataset.originalStatus;
                        handleCloseClick(userId, originalStatus);
                        event.event.preventDefault();
                        return;
                    }

                    // Delete button clicked
                    if (target.classList && target.classList.contains("delete-btn")) {
                        const userId = target.dataset.userId;
                        handleDeleteClick(userId);
                        event.event.preventDefault();
                        return;
                    }

                    // Status dropdown changed
                    if (target.classList && target.classList.contains("status-dropdown")) {
                        const userId = target.dataset.userId;
                        const newStatus = target.value;
                        handleStatusChange(userId, newStatus);
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

    // Refresh grid when editing state or status values change
    useEffect(() => {
        if (gridApi) {
            gridApi.refreshCells({ force: true });
        }
    }, [editingRows, statusValues, gridApi]);

    if (!isLoaded || loading) {
        return (
            <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
                <div style={{ textAlign: 'center', padding: 40 }}>
                    {loading ? "Loading users..." : "Loading AG Grid..."}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 24 }}>
                Admin Table
            </h2>

            {/* Search Box */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <div
                    style={{
                        position: "relative",
                        width: 360,
                        borderRadius: 8,
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }}
                >
                    <SearchOutlined
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 14,
                            transform: "translateY(-50%)",
                            color: "#9CA3AF",
                        }}
                    />
                    <input
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
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
            background: #11699e !important;
            border-bottom: 1px solid #0e5680;
          }
          .ag-theme-alpine .ag-header-cell {
            color: white !important;
            font-weight: 600;
          }
          .ag-theme-alpine .ag-header-cell-text {
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
            border-left: 1px solid #0e5680;
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
                    style={{ height: 550, width: '100%' }}
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
        </div>
    );
}
