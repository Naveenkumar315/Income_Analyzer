// AdminTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import authApi from "../../api/authApi";
import toast from "react-hot-toast";
import FilterIcon from "../../assets/icons/Filter.svg";
import circleCheck from "../../assets/icons/circle-check.svg";
import circleClose from "../../assets/icons/circle-close.svg";
import deleteIcon from "../../assets/icons/delete.svg";

export default function AdminTable() {
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState("");
    const [gridApi, setGridApi] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [users, setUsers] = useState([]);
    const [actionInProgress, setActionInProgress] = useState(false);

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
                    const primaryContact = user.primaryContact || {};

                    name = `${primaryContact.firstName || ""} ${primaryContact.lastName || ""}`.trim();
                    if (!name) name = companyInfo.companyName || "";

                    email = primaryContact.email || user.email || companyInfo.companyEmail;
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

    const fetchUsers = async ({ suppressLoader = false } = {}) => {
        if (!suppressLoader) setInitialLoading(true);
        try {
            const response = await authApi.getAllUsers();
            const rawUsers = response && response.users ? response.users : [];
            const transformedData = transformUserData(rawUsers);
            setUsers(transformedData);

            if (gridApi && typeof gridApi.setRowData === "function") {
                try {
                    gridApi.setRowData(transformedData);
                } catch (innerErr) {
                    console.warn("gridApi.setRowData failed, ignoring", innerErr);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
            setUsers([]);
        } finally {
            if (!suppressLoader) setInitialLoading(false);
        }
    };

    const getConfirmModalContent = (title, message, iconSrc) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", width: "100%" }}>
            {iconSrc && <img src={iconSrc} alt="icon" style={{ width: "48px", height: "48px" }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#18181B" }} className="font-creato">{title}</span>
                <span style={{ fontSize: "14px", fontWeight: 400, color: "#71717A" }} className="font-creato">{message}</span>
            </div>
        </div>
    );

    const showCustomConfirm = ({ title, content, icon, onOk, okText = "Yes", cancelText = "No", okType = "primary", okButtonProps = {} }) => {
        Modal.confirm({
            className: "custom-confirm-modal",
            icon: null, // We render icon in content
            content: getConfirmModalContent(title, content, icon),
            okText,
            cancelText,
            okType,
            centered: true,
            width: 360,
            okButtonProps: { ...okButtonProps, style: { height: "32px", borderRadius: "6px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" } },
            cancelButtonProps: { style: { height: "32px", borderRadius: "6px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E0E0E0" } },
            onOk,
        });
    };

    const handleApprove = (userId) => {
        if (!userId) return;

        showCustomConfirm({
            title: "Approve User",
            content: "Are you sure you want to approve this user?",
            icon: circleCheck, // Using existing import
            okText: "Approve",
            onOk: async () => {
                setActionInProgress(true);
                try {
                    await authApi.updateUserStatus(userId, "active");
                    toast.success("User approved successfully");
                    await fetchUsers({ suppressLoader: true });
                } catch (error) {
                    console.error("Error approving user:", error);
                    toast.error("Failed to approve user");
                } finally {
                    setActionInProgress(false);
                }
            }
        });
    };

    const handleReject = (userId) => {
        if (!userId) return;

        showCustomConfirm({
            title: "Reject User",
            content: "Are you sure you want to reject this user?",
            icon: circleClose, // Using existing import
            okText: "Reject",
            okButtonProps: { danger: true },
            onOk: async () => {
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
            }
        });
    };

    const handleDelete = (userId) => {
        if (!userId) return;

        showCustomConfirm({
            title: "Delete User",
            content: "Are you sure you want to permanently delete this user? This action cannot be undone.",
            icon: deleteIcon, // Using existing import
            okText: "Yes",
            okButtonProps: { danger: true, style: { background: "#dc2626", borderColor: "#dc2626", color: "white" } }, // Explicit red for delete
            onOk: async () => {
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
            }
        });
    };

    const handleStatusToggle = (userId, newStatus) => {
        if (!userId) return;

        const actionText = newStatus === "active" ? "activate" : "deactivate";
        const titleText = newStatus === "active" ? "Activate User" : "Deactivate User";
        const icon = newStatus === "active" ? circleCheck : circleClose;

        showCustomConfirm({
            title: titleText,
            content: `Are you sure you want to ${actionText} this user?`,
            icon: icon,
            okText: "Yes",
            okType: newStatus === "active" ? "primary" : "danger",
            onOk: async () => {
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
            }
        });
    };

    useEffect(() => {
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
                setIsLoaded(true);
            };
            document.body.appendChild(script);
        } else {
            setIsLoaded(true);
        }

        fetchUsers({ suppressLoader: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columnDefs = useMemo(
        () => [
            {
                field: "name",
                headerName: "Full Name",
                minWidth: 180,
                flex: 1,
                filter: true,
                sortable: true,
                resizable: false,
            },
            {
                field: "email",
                headerName: "Email",
                minWidth: 220,
                flex: 1,
                filter: true,
                sortable: true,
                resizable: false,
            },
            {
                field: "phone",
                headerName: "Phone Number",
                width: 140,
                filter: true,
                sortable: true,
                resizable: false,
                suppressSizeToFit: true,
            },
            {
                field: "status",
                headerName: "Status",
                width: 140,
                sortable: true,
                resizable: false,
                suppressSizeToFit: true,
                cellRenderer: (params) => {
                    const isActive = params.data.isActive;
                    const isPending = params.data.status === "pending";
                    return `
            <div style="display:flex;align-items:center;height:100%;padding-left:8px;">
              <label style="position:relative;display:flex;width:26px;height:16px;justify-content:center;align-items:center;cursor:${isPending ? "not-allowed" : "pointer"};opacity:${isPending ? "0.6" : "1"};">
                <input type="checkbox" ${isActive ? "checked" : ""} ${isPending ? "disabled" : ""} class="status-toggle" data-id="${params.data.id}" data-status="${params.data.status}" style="opacity:0;width:0;height:0;pointer-events:none;" />
                <span style="position:absolute;cursor:${isPending ? "not-allowed" : "pointer"};top:0;left:0;right:0;bottom:0;background-color:${isActive ? "#3b82f6" : "#cbd5e1"};transition:0.3s;border-radius:16px;">
                  <span style="position:absolute;height:12px;width:12px;left:${isActive ? "12px" : "2px"};bottom:2px;background:white;transition:0.3s;border-radius:50%;"></span>
                </span>
              </label>
              <span class="font-creato" style="margin-left:8px;font-size:13px;color:#64748b;">${isActive ? "Active" : "Inactive"}</span>
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
                resizable: false,
                suppressSizeToFit: true,
            },
            {
                field: "approvedOn",
                headerName: "Approved / Rejected On",
                width: 180,
                filter: true,
                sortable: true,
                resizable: false,
                suppressSizeToFit: true,
            },
            {
                field: "companyType",
                headerName: "Company Type",
                width: 140,
                filter: true,
                sortable: true,
                resizable: false,
                suppressSizeToFit: true,
            },
            {
                field: "companySize",
                headerName: "Company Size",
                width: 140,
                filter: true,
                sortable: true,
                resizable: false,
                suppressSizeToFit: true,
                cellStyle: { textAlign: "center" },
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 220,
                pinned: "right",
                resizable: false,
                suppressMovable: true,
                lockPosition: true,
                lockPinned: true,
                suppressSizeToFit: true,
                // We keep cell renderer as-is; shadow will be applied to container (pinned area)
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
                        return `
              <div style="display:flex;flex-direction:column;gap:4px;padding:4px 0;">
                <div style="display:flex;gap:12px;align-items:center;">
                  <button class="approve-btn font-creato" data-id="${params.data.id}" style="${baseBtnStyle} color:#16a34a;" title="Approve">
                    <img src="${circleCheck}" alt="Approve" style="width:14px;height:14px;"/>
                    <span>Approve</span>
                  </button>

                  <button class="reject-btn font-creato" data-id="${params.data.id}" style="${baseBtnStyle} color:#dc2626;" title="Reject">
                    <img src="${circleClose}" alt="Reject" style="width:14px;height:14px;"/>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            `;
                    }

                    return `
            <div style="display:flex;flex-direction:column;padding:4px 0;">
              <button class="delete-btn font-creato" data-id="${params.data.id}" style="${baseBtnStyle} color:#dc2626;" title="Delete User">
                <img src="${deleteIcon}" alt="Delete" style="width:14px;height:14px;"/>
                <span style="color:#4D4D4D;">Delete User</span>
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
                    resizable: false,
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
                        const user = event.data;

                        if (user) {
                            event.event.preventDefault();
                            if (user.status === "pending") {
                                return;
                            } else {
                                const newStatus = user.isActive ? "inactive" : "active";
                                handleStatusToggle(id, newStatus);
                            }
                        }
                    }
                },
            };

            window.agGrid.createGrid(gridRef.current, gridOptions);
        }
    }, [isLoaded, columnDefs, filteredData, gridApi, pageSize, users]);

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

    // Loading view uses same calc to respect the external fixed 48px header
    if (!isLoaded || initialLoading) {
        return (
            <div style={{ padding: 32, background: "#f8fafc", minHeight: "calc(100vh - 48px)" }}>
                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
            </div>
        );
    }

    return (
        // NOTE: outer height subtracts external header (48px). Adjust if your external header is different.
        <div
            style={{
                padding: "24px",
                background: "#f8fafc",
                minHeight: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
            }}
        >
            {/* header + search UI (unchanged) */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: 24, flexShrink: 0 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }} className="custom-font-jura">User Management</h2>

                <div style={{ display: "flex", width: "60px", height: '32px', padding: "4px 12px", margin: "4px 0px", justifyContent: "center", alignItems: "center", gap: 8, alignSelf: "stretch", borderRadius: "999px", background: "#E0E0E0" }}>
                    <span style={{ textAlign: "center", color: "#303030", fontFamily: 'Creato Display', fontSize: "16px", fontStyle: 'normal', fontWeight: 400, lineHeight: "20px" }}>{filteredData.length}</span>
                </div>

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

            {/* AG Grid container - flex column. grid + footer share the remaining space */}
            <div style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)", border: "1px solid #eee", background: "white", display: "flex", flexDirection: "column" }}>
                <style>{`
          .ag-theme-alpine .ag-header { background: #F7F7F7 !important; }
          .ag-theme-alpine .ag-header-cell { background: #0369a1; color: white !important; font-family: 'Creato Display', sans-serif !important; font-weight: 400; padding: 4px 8px !important; display: flex; align-items: center; font-size: 14px !important; line-height: 16px !important; font-style: normal !important; }
          .ag-theme-alpine .ag-header-cell:hover { background-color: #0369a1 !important; background: #0369a1 !important; }
          .ag-theme-alpine .ag-header-cell-text { color: white !important; }
          .ag-theme-alpine .ag-header-icon { color: white !important; }
          .ag-theme-alpine .ag-row { font-family: 'Creato Display', sans-serif !important; font-size: 14px !important; color: #303030 !important; font-weight: 400 !important; border-bottom: 1px solid #E0E0E0 !important; display: flex !important; align-items: center !important; padding: 0 !important; }
          .ag-theme-alpine .ag-row-odd { background: #F7F7F7 !important; height: 48px !important; }
          .ag-theme-alpine .ag-row-even { background: #FFF !important; height: 48px !important; }
          .ag-theme-alpine .ag-row-hover { background: #eff6ff !important; }
          .ag-theme-alpine .ag-cell { display: flex !important; align-items: center !important; padding: 4px 8px !important; gap: 8px !important; color: #303030 !important; font-weight: 400 !important; line-height: normal !important; border: none !important; }

          /* === PINNED-RIGHT CONTAINER STYLES (left border + left-only shadow) === */
          /* Applies the left border and a left-side shadow for the whole pinned-right area */
          .ag-theme-alpine .ag-pinned-right-header,
          .ag-theme-alpine .ag-pinned-right-cols-container {
              background: inherit !important;
              border-left: 1px solid var(--Colors-Border-Base-base, #E0E0E0);
              /* negative X offset to push shadow leftwards */
              box-shadow: -12px 0px 30px -12px rgba(0, 0, 0, 0.25);
              z-index: 2; /* ensure it sits above the main body visually */
          }

          /* Ensure individual pinned cells don't duplicate the shadow */
          .ag-theme-alpine .ag-pinned-right-cols-container .ag-cell {
              background: inherit !important;
              border-left: none !important;
              box-shadow: none !important;
          }

          /* === CUSTOM CONFIRM MODAL STYLES === */
          .custom-confirm-modal .ant-modal-content {
              padding: 16px !important;
              border-radius: 6px !important;
              width: 360px !important;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
              border-bottom: 1px solid var(--Colors-Border-Base-base, #E0E0E0);
              background: var(--background-or-layer-contextual, #FFF);
          }
          
          .custom-confirm-modal .ant-modal-body {
              padding: 0 !important;
              margin: 0 !important;
              width: 100%;
          }

          .custom-confirm-modal .ant-modal-confirm-content {
             margin: 0 !important;
          }

          .custom-confirm-modal .ant-modal-confirm-btns {
              margin-top: 16px !important;
              width: 100%;
              display: flex !important;
              gap: 12px;
              justify-content: center;
              float: none !important;
          }
          
          /* Hide default icon container since we put icon in content */
          .custom-confirm-modal .ant-modal-confirm-body-wrapper {
             align-items: center; 
          }
          .custom-confirm-modal .ant-modal-confirm-body .ant-modal-confirm-icon {
              display: none !important;
          }

          .ag-theme-alpine .ag-root-wrapper { border: none; }
        `}</style>

                {/* Grid wrapper: dynamic height with max limit */}
                <div
                    ref={gridRef}
                    className="ag-theme-alpine font-creato"
                    style={{
                        width: "100%",
                        height: `${Math.max(1, Math.min(pageSize, filteredData.length - (currentPage - 1) * pageSize)) * 48 + 50}px`,
                        maxHeight: "calc(100vh - 280px)",
                        transition: "height 0.2s",
                        minHeight: "150px"
                    }}
                />

                {/* Pagination footer - fixed height inside this card */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "white", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="font-creato" style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>Items per page:</span>
                        <div style={{ position: "relative" }}>
                            <select className="font-creato" value={pageSize} onChange={(e) => {
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

                        <span className="font-creato" style={{ fontSize: "14px", color: "#9ca3af", marginLeft: "8px" }}>
                            {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} items
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                                    return <span key={`ellipsis-${idx}`} className="font-creato" style={{ padding: "6px 8px", fontSize: "14px", color: "#9ca3af" }}>...</span>;
                                }
                                const isFirstThree = page <= 3;
                                const isActive = currentPage === page;
                                return (
                                    <button className="font-creato" key={page} onClick={() => {
                                        setCurrentPage(page);
                                        if (gridApi) gridApi.paginationGoToPage(page - 1);
                                    }} style={{ minWidth: "36px", height: "36px", padding: "6px 12px", fontSize: "14px", border: "none", borderRadius: "6px", background: isActive ? "#3b82f6" : (isFirstThree ? "#e0f2fe" : "transparent"), color: isActive ? "white" : "#374151", cursor: "pointer", fontWeight: isActive ? 600 : 400, transition: "all 0.2s" }}>
                                        {page}
                                    </button>
                                );
                            });
                        })()}

                        <div style={{ width: "1px", height: "24px", background: "#e5e7eb", margin: "0 8px" }} />

                        <button className="font-creato" onClick={() => {
                            if (currentPage > 1) {
                                const newPage = currentPage - 1;
                                setCurrentPage(newPage);
                                if (gridApi) gridApi.paginationGoToPage(newPage - 1);
                            }
                        }} disabled={currentPage === 1} style={{ border: "none", background: "transparent", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}>‹</button>

                        <button className="font-creato" onClick={() => {
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
