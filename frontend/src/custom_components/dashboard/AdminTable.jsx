// AdminTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { SearchOutlined } from "@ant-design/icons";
import authApi from "../../api/authApi";
import { toast } from "react-toastify";
import FilterIcon from "../../assets/icons/Filter.svg";
import circleCheck from "../../assets/icons/circle-check.svg";
import circleClose from "../../assets/icons/circle-close.svg";
import deleteIcon from "../../assets/icons/delete.svg";

export default function AdminTable() {
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState("");
    const [gridApi, setGridApi] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // only true on first mount
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [users, setUsers] = useState([]);
    const [actionInProgress, setActionInProgress] = useState(false); // toggles during approve/reject/delete

    // Defensive transform: handle missing/invalid input
    const transformUserData = (usersArray) => {
        try {
            if (!Array.isArray(usersArray)) return [];
            return usersArray.map((user) => {
                let name, email, phone, companyType, companySize;

                if (user.type === "individual") {
                    const info = user.individualInfo || {};
                    name = `${info.firstName || ""} ${info.lastName || ""}`.trim();
                    email = info.email || user.email;
                    phone = info.phone || "";
                    companyType = "Broker";
                    companySize = "1";
                } else if (user.type === "company") {
                    const companyInfo = user.companyInfo || {};
                    name = companyInfo.companyName || "";
                    email = companyInfo.companyEmail || user.email;
                    phone = companyInfo.companyPhone || "";
                    companyType = "Broker Company";
                    companySize = companyInfo.companySize || "-";
                } else {
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
                    submittedOn: user.created_at
                        ? new Date(user.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        })
                        : "-",
                    approvedOn: user.approvedOn
                        ? new Date(user.approvedOn).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        })
                        : "-",
                    companyType,
                    companySize,
                    status: user.status || "pending",
                    isActive: user.status === "active",
                };
            });
        } catch (err) {
            console.error("transformUserData error:", err);
            return [];
        }
    };

    // Fetch users from backend
    // suppressLoader=true -> do not show the initial spinner (used for action refresh)
    const fetchUsers = async ({ suppressLoader = false } = {}) => {
        if (!suppressLoader) setInitialLoading(true);
        try {
            const response = await authApi.getAllUsers();
            const rawUsers = response && response.users ? response.users : [];
            const transformedData = transformUserData(rawUsers);
            setUsers(transformedData);

            // If grid is already initialized, update row data directly so grid doesn't get re-created
            if (gridApi && typeof gridApi.setRowData === "function") {
                try {
                    gridApi.setRowData(transformedData);
                } catch (innerErr) {
                    // fallback
                    console.warn("gridApi.setRowData failed, ignoring", innerErr);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
            setUsers([]); // safe fallback so component doesn't crash
        } finally {
            // only end initial loading if this was initial fetch
            if (!suppressLoader) setInitialLoading(false);
        }
    };

    // Approve
    const handleApprove = async (userId) => {
        if (!userId) return;
        if (!window.confirm("Are you sure you want to approve this user?")) return;
        setActionInProgress(true);
        try {
            await authApi.updateUserStatus(userId, "active");
            toast.success("User approved successfully");
            // refresh without hiding table
            await fetchUsers({ suppressLoader: true });
        } catch (error) {
            console.error("Error approving user:", error);
            toast.error("Failed to approve user");
        } finally {
            setActionInProgress(false);
        }
    };

    // Reject
    const handleReject = async (userId) => {
        if (!userId) return;
        if (!window.confirm("Are you sure you want to reject this user?")) return;
        setActionInProgress(true);
        try {
            await authApi.updateUserStatus(userId, "inactive");
            toast.success("User rejected successfully");
            await fetchUsers({ suppressLoader: true });
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast.error("Failed to reject user");
        } finally {
            setActionInProgress(false);
        }
    };

    // Delete
    const handleDelete = async (userId) => {
        if (!userId) return;
        if (
            !window.confirm(
                "Are you sure you want to permanently delete this user? This action cannot be undone."
            )
        )
            return;
        setActionInProgress(true);
        try {
            await authApi.deleteUser(userId);
            toast.success("User deleted successfully");
            await fetchUsers({ suppressLoader: true });
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        } finally {
            setActionInProgress(false);
        }
    };

    // Toggle status for non-pending users
    const handleStatusToggle = async (userId, newStatus) => {
        if (!userId) return;
        setActionInProgress(true);
        try {
            await authApi.updateUserStatus(userId, newStatus);
            toast.success(`User status updated to ${newStatus}`);
            await fetchUsers({ suppressLoader: true });
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        } finally {
            setActionInProgress(false);
        }
    };

    useEffect(() => {
        // Load AG Grid CSS
        const cssLinks = [
            "https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-grid.css",
            "https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-theme-alpine.css",
        ];

        cssLinks.forEach((href) => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = href;
                document.head.appendChild(link);
            }
        });

        // Load AG Grid JS
        if (!window.agGrid) {
            const script = document.createElement("script");
            script.src =
                "https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/dist/ag-grid-community.min.js";
            script.onload = () => {
                console.log("AG Grid loaded");
                setIsLoaded(true);
            };
            script.onerror = () => {
                console.error("Failed to load AG Grid");
                setIsLoaded(true); // avoid blocking rendering; grid code will warn if not available
            };
            document.body.appendChild(script);
        } else {
            setIsLoaded(true);
        }

        // initial fetch (show spinner)
        fetchUsers({ suppressLoader: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columnDefs = useMemo(
        () => [
            {
                field: "name",
                headerName: "Full Name",
                width: 180,
                filter: true,
                sortable: true,
            },
            {
                field: "email",
                headerName: "Email",
                width: 220,
                filter: true,
                sortable: true,
            },
            {
                field: "phone",
                headerName: "Phone Number",
                width: 150,
                filter: true,
                sortable: true,
            },
            {
                field: "status",
                headerName: "Status",
                width: 120,
                sortable: true,
                cellRenderer: (params) => {
                    const isActive = params.data.isActive;
                    return `
            <div style="display:flex;align-items:center;height:100%;padding-left:8px;">
              <label style="position:relative;display:inline-block;width:48px;height:24px;">
                <input type="checkbox" ${isActive ? "checked" : ""} class="status-toggle" data-id="${params.data.id}" data-status="${params.data.status}" style="opacity:0;width:0;height:0;" />
                <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:${isActive ? "#3b82f6" : "#cbd5e1"};transition:0.3s;border-radius:24px;">
                  <span style="position:absolute;height:18px;width:18px;left:${isActive ? "27px" : "3px"};bottom:3px;background:white;transition:0.3s;border-radius:50%;"></span>
                </span>
              </label>
              <span style="margin-left:8px;font-size:13px;color:#64748b;">${isActive ? "Active" : "Inactive"}</span>
            </div>
          `;
                },
                cellStyle: { display: "flex", alignItems: "center" },
            },
            {
                field: "submittedOn",
                headerName: "Submitted On",
                width: 180,
                filter: true,
                sortable: true,
            },
            {
                field: "approvedOn",
                headerName: "Approved / Rejected On",
                width: 180,
                filter: true,
                sortable: true,
            },
            {
                field: "companyType",
                headerName: "Company Type",
                width: 140,
                filter: true,
                sortable: true,
            },
            {
                field: "companySize",
                headerName: "Company Size",
                width: 130,
                filter: true,
                sortable: true,
                cellStyle: { textAlign: "center" },
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 220,
                pinned: "right",
                cellRenderer: (params) => {
                    const isPending = params.data.status === "pending";
                    const baseBtnStyle = `
            display: flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 13px;
            padding: 2px 0;
          `;

                    if (isPending) {
                        // Approve + Reject side-by-side, Delete below
                        return `
              <div style="display:flex;flex-direction:column;gap:4px;padding:4px 0;">
                <div style="display:flex;gap:12px;align-items:center;">
                  <button class="approve-btn" data-id="${params.data.id}" style="${baseBtnStyle} color:#16a34a;" title="Approve">
                    <img src="${circleCheck}" alt="Approve" style="width:14px;height:14px;"/>
                    <span>Approve</span>
                  </button>

                  <button class="reject-btn" data-id="${params.data.id}" style="${baseBtnStyle} color:#dc2626;" title="Reject">
                    <img src="${circleClose}" alt="Reject" style="width:14px;height:14px;"/>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            `;
                    }

                    // non-pending: only delete
                    return `
            <div style="display:flex;flex-direction:column;padding:4px 0;">
              <button class="delete-btn" data-id="${params.data.id}" style="${baseBtnStyle} color:#dc2626;" title="Delete User">
                <img src="${deleteIcon}" alt="Delete" style="width:14px;height:14px;"/>
                <span>Delete User</span>
              </button>
            </div>
          `;
                },
                cellStyle: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingLeft: "8px",
                },
            },
        ],
        // icons referenced in renderer are imported above; memo stable
        []
    );

    const filteredData = useMemo(() => {
        if (!searchText) return users;
        const search = searchText.toLowerCase();
        return users.filter((row) =>
            Object.values(row).some((val) => String(val).toLowerCase().includes(search))
        );
    }, [users, searchText]);

    useEffect(() => {
        if (isLoaded && gridRef.current && window.agGrid && !gridApi) {
            const gridOptions = {
                columnDefs,
                rowData: filteredData,
                defaultColDef: {
                    resizable: true,
                    suppressMenu: true,
                },
                pagination: true,
                paginationPageSize: pageSize,
                suppressPaginationPanel: true,
                domLayout: "normal",
                rowHeight: 48,
                headerHeight: 48,
                suppressCellFocus: true,
                onGridReady: (params) => {
                    setGridApi(params.api);
                    params.api.addEventListener("paginationChanged", () => {
                        setCurrentPage(params.api.paginationGetCurrentPage() + 1);
                    });
                },
                onCellClicked: (event) => {
                    const rawTarget = event.event.target;

                    const findButton = (className) => {
                        if (!rawTarget) return null;
                        return rawTarget.closest ? rawTarget.closest(`.${className}`) : rawTarget.classList && rawTarget.classList.contains(className) ? rawTarget : null;
                    };

                    const approveBtn = findButton("approve-btn");
                    if (approveBtn) {
                        const id = approveBtn.dataset.id;
                        event.event.preventDefault();
                        handleApprove(id);
                        return;
                    }

                    const rejectBtn = findButton("reject-btn");
                    if (rejectBtn) {
                        const id = rejectBtn.dataset.id;
                        event.event.preventDefault();
                        handleReject(id);
                        return;
                    }

                    const deleteBtn = findButton("delete-btn");
                    if (deleteBtn) {
                        const id = deleteBtn.dataset.id;
                        event.event.preventDefault();
                        handleDelete(id);
                        return;
                    }

                    if (rawTarget.classList && rawTarget.classList.contains("status-toggle")) {
                        const id = rawTarget.dataset.id;
                        // Use row data directly from the event to avoid stale state issues with 'users'
                        const user = event.data;

                        if (user) {
                            event.event.preventDefault();
                            if (user.status === "pending") {
                                handleApprove(id);
                            } else {
                                const newStatus = user.isActive ? "inactive" : "active";
                                handleStatusToggle(id, newStatus);
                            }
                        }
                    }
                },
            };

            // create the grid once
            window.agGrid.createGrid(gridRef.current, gridOptions);
        }
    }, [isLoaded, columnDefs, filteredData, gridApi, pageSize, users]);

    // keep grid rows in sync when filteredData changes
    useEffect(() => {
        if (gridApi) {
            try {
                gridApi.setRowData(filteredData);
            } catch (err) {
                try {
                    gridApi.setGridOption && gridApi.setGridOption("rowData", filteredData);
                } catch (inner) {
                    console.warn("Failed to update grid rowData", inner);
                }
            }
        }
    }, [filteredData, gridApi]);

    // show spinner only for the initial load
    if (!isLoaded || initialLoading) {
        return (
            <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: "0px 24px", background: "#f8fafc", minHeight: "100dvh" }}>
            {/* header + search UI (unchanged) */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }} className="custom-font-jura">User Management</h2>

                <span style={{ display: "flex", padding: "4px", width: "60px", justifyContent: "center", alignItems: "center", gap: 8, alignSelf: "stretch", borderRadius: "999px", background: "#E0E0E0" }}>
                    {filteredData.length}
                </span>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ position: "relative", width: 360, borderRadius: "8px", border: "1px solid #E0E0E0", background: "#fff", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}>
                        <SearchOutlined style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", color: "#4D4D4D" }} />
                        <input placeholder="Search loan, borrower etc." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="custom-font-jura" style={{ width: "100%", border: "none", outline: "none", padding: "10px 14px 10px 42px", borderRadius: 8, fontSize: 15 }} />
                    </div>

                    <button className="custom-font-jura" style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: 15, color: "#303030" }}>
                        <img src={FilterIcon} alt="Filter" />
                        Filter
                    </button>

                    <div style={{ width: "1px", height: "24px", background: "#D0D0D0" }} />
                </div>

                <div style={{ background: "#E0E0E0", justifyContent: "center", borderRadius: "999px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="custom-font-jura" style={{ color: "#303030", textAlign: "center", fontSize: "normal", fontWeight: 400, lineHeight: "18px" }}>All</span>
                    <button className="custom-font-jura" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, padding: 0, display: "flex", alignItems: "center" }}>✕</button>
                </div>
            </div>

            {/* AG Grid container */}
            <div style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)", border: "1px solid #eee", background: "white" }}>
                <style>{`
          .ag-theme-alpine .ag-header { background: #0369a1 !important; border-bottom: 1px solid #075985; }
          .ag-theme-alpine .ag-header-cell { color: white !important; font-weight: 600; }
          .ag-theme-alpine .ag-header-cell-text { color: white !important; }
          .ag-theme-alpine .ag-header-icon { color: white !important; }
          .ag-theme-alpine .ag-row-even { background: white; }
          .ag-theme-alpine .ag-row-odd { background: #f9fafb; }
          .ag-theme-alpine .ag-row-hover { background: #eff6ff !important; }
          .ag-theme-alpine .ag-cell { border-bottom: 1px solid #f1f5f9; }
          .ag-theme-alpine .ag-pinned-right-header { border-left: 1px solid #075985; }
          .ag-theme-alpine .ag-pinned-right-cols-container .ag-cell { border-left: 1px solid #eee; }
          .ag-theme-alpine .ag-root-wrapper { border: none; }
        `}</style>

                <div ref={gridRef} className="ag-theme-alpine" style={{ height: 450, width: "100%" }} />

                {/* Custom pagination */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>Items per page:</span>
                        <div style={{ position: "relative" }}>
                            <select value={pageSize} onChange={(e) => {
                                const newSize = Number(e.target.value);
                                setPageSize(newSize);
                                setCurrentPage(1);
                                if (gridApi) {
                                    gridApi.paginationSetPageSize(newSize);
                                    gridApi.paginationGoToPage(0);
                                }
                            }} style={{ appearance: "none", padding: "6px 32px 6px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "4px", background: "white", cursor: "pointer", minWidth: "70px", color: "#374151" }}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "12px", color: "#6b7280" }}>▼</span>
                        </div>

                        <span style={{ fontSize: "14px", color: "#9ca3af", marginLeft: "8px" }}>
                            {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} items
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {/* page number buttons */}
                        {(() => {
                            const totalPages = Math.ceil(filteredData.length / pageSize);
                            const pages = [];
                            pages.push(1);
                            if (currentPage > 3) pages.push("...");
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                if (!pages.includes(i)) pages.push(i);
                            }
                            if (currentPage < totalPages - 2) pages.push("...");
                            if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);

                            return pages.map((page, idx) => {
                                if (page === "...") {
                                    return <span key={`ellipsis-${idx}`} style={{ padding: "6px 8px", fontSize: "14px", color: "#9ca3af" }}>...</span>;
                                }
                                const isFirstThree = page <= 3;
                                const isActive = currentPage === page;
                                return (
                                    <button key={page} onClick={() => {
                                        setCurrentPage(page);
                                        if (gridApi) gridApi.paginationGoToPage(page - 1);
                                    }} style={{ minWidth: "36px", height: "36px", padding: "6px 12px", fontSize: "14px", border: "none", borderRadius: "6px", background: isActive ? "#3b82f6" : (isFirstThree ? "#e0f2fe" : "transparent"), color: isActive ? "white" : "#374151", cursor: "pointer", fontWeight: isActive ? 600 : 400, transition: "all 0.2s" }}>
                                        {page}
                                    </button>
                                );
                            });
                        })()}

                        <div style={{ width: "1px", height: "24px", background: "#e5e7eb", margin: "0 8px" }} />

                        <button onClick={() => {
                            if (currentPage > 1) {
                                const newPage = currentPage - 1;
                                setCurrentPage(newPage);
                                if (gridApi) gridApi.paginationGoToPage(newPage - 1);
                            }
                        }} disabled={currentPage === 1} style={{ border: "none", background: "transparent", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}>‹</button>

                        <button onClick={() => {
                            const totalPages = Math.ceil(filteredData.length / pageSize);
                            if (currentPage < totalPages) {
                                const newPage = currentPage + 1;
                                setCurrentPage(newPage);
                                if (gridApi) gridApi.paginationGoToPage(newPage - 1);
                            }
                        }} disabled={currentPage === Math.ceil(filteredData.length / pageSize)} style={{ border: "none", background: "transparent", cursor: currentPage === Math.ceil(filteredData.length / pageSize) ? "not-allowed" : "pointer", color: currentPage === Math.ceil(filteredData.length / pageSize) ? "#d1d5db" : "#374151", fontSize: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}>›</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
