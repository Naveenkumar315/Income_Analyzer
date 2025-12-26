import React, { useState, useEffect, useMemo } from "react";
import ReusableDataTable from "../ReusableDataTable";
import authApi from "../../api/authApi";
import toast from "../../utils/ToastService";
import CreateCompanyUserModal from "../../modals/CreateCompanyUserModal";
import { useApp } from "../../contexts/AppContext";
import { Modal, Select } from "antd";
import useRefreshUser from "../../hooks/useRefreshUser";
import { Icons } from "../../utils/icons";

export default function AdminTable_() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { user } = useApp();
    const { refreshUser } = useRefreshUser();

    //  Single useEffect to ensure user is loaded before fetching users
    useEffect(() => {
        const initializeData = async () => {
            const email = sessionStorage.getItem('user_email');

            if (!email) {
                setLoading(false);
                return;
            }

            //  Wait for user to be loaded first
            if (!user) {
                await refreshUser(email);
            }

            //  Now fetch users (user state will be available)
            fetchUsers();
        };

        initializeData();
    }, []); //  Run only once on mount

    //  Separate effect to re-fetch users when user changes
    useEffect(() => {
        if (user) {
            fetchUsers();
        }
    }, [user?._id]); //  Only when user ID changes

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
                    companyType = "Individual";
                    companySize = "1";
                } else if (user.type === "company") {
                    const companyInfo = user.companyInfo || {};
                    const primaryContact = user.primaryContact || {};
                    name = `${primaryContact.firstName || ""} ${primaryContact.lastName || ""}`.trim();
                    if (!name) name = companyInfo.companyName || "";
                    email = primaryContact.email || user.email || companyInfo.companyEmail;
                    phone = primaryContact.phone || "";
                    companyType = "Company";
                    companySize = companyInfo.companySize || "-";
                } else {
                    name = user.username || "-";
                    email = user.email;
                    phone = "-";
                    companyType = "-";
                    companySize = "-";
                }

                const approvedOrCreatedDate = user.approvedOn || user.created_at;

                return {
                    id: user._id,
                    name,
                    email,
                    role: user.role,
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
                    approvedOn: approvedOrCreatedDate
                        ? new Date(approvedOrCreatedDate).toLocaleString("en-US", {
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

    //  Removed setTimeout and added safety check
    const fetchUsers = async () => {
        if (!user?.email) {
            console.warn("fetchUsers called without user email");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.getAllUsers();
            let rawUsers = response?.users || [];

            if (user?.isCompanyAdmin) {
                rawUsers = rawUsers.filter(u =>
                    u._id === user._id ||
                    u.company_id === user._id
                );
            }

            const transformedData = transformUserData(rawUsers);
            setUsers(transformedData);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const showCustomConfirm = ({ title, content, icon, onOk, okText = "Yes", cancelText = "No", okButtonProps = {} }) => {
        Modal.confirm({
            className: "custom-confirm-modal",
            icon: null,
            content: (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", width: "100%" }}>
                    {icon && <img src={icon} alt="icon" style={{ width: "48px", height: "48px" }} />}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "#18181B" }} className="font-creato">{title}</span>
                        <span style={{ fontSize: "14px", fontWeight: 400, color: "#71717A" }} className="font-creato">{content}</span>
                    </div>
                </div>
            ),
            okText,
            cancelText,
            centered: true,
            width: 360,
            okButtonProps,
            cancelButtonProps: { style: { height: "32px", borderRadius: "6px", flex: 1, border: "1px solid #E0E0E0" } },
            onOk,
        });
    };

    const handleApprove = (userId) => {
        if (!userId) return;
        showCustomConfirm({
            title: "Approve User",
            content: "Are you sure you want to approve this user?",
            icon: Icons.adminTable.circleCheck,
            okText: "Approve",
            onOk: async () => {
                setActionInProgress(true);
                try {
                    await authApi.updateUserStatus(userId, "active");
                    toast.success("User approved successfully");
                    await fetchUsers();
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
            icon: Icons.adminTable.circleClose,
            okText: "Reject",
            okButtonProps: { danger: true },
            onOk: async () => {
                setActionInProgress(true);
                try {
                    await authApi.updateUserStatus(userId, "inactive");
                    toast.success("User rejected successfully");
                    await fetchUsers();
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
            icon: Icons.adminTable.deleteIcon,
            okText: "Yes",
            okButtonProps: { danger: true, style: { background: "#dc2626", borderColor: "#dc2626", color: "white" } },
            onOk: async () => {
                setActionInProgress(true);
                try {
                    await authApi.deleteUser(userId);
                    toast.success("User deleted successfully");
                    await fetchUsers();
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
        const icon = newStatus === "active" ? Icons.adminTable.circleCheck : Icons.adminTable.circleClose;

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
                    await fetchUsers();
                } catch (error) {
                    console.error("Error updating user status:", error);
                    toast.error("Failed to update user status");
                } finally {
                    setActionInProgress(false);
                }
            }
        });
    };

    const handleCellClick = (event) => {
        const rawTarget = event.event.target;
        const findButton = (className) => {
            if (!rawTarget) return null;
            return rawTarget.closest ? rawTarget.closest(`.${className}`) :
                rawTarget.classList && rawTarget.classList.contains(className) ? rawTarget : null;
        };

        const approveBtn = findButton("approve-btn");
        if (approveBtn) {
            event.event.preventDefault();
            handleApprove(approveBtn.dataset.id);
            return;
        }

        const rejectBtn = findButton("reject-btn");
        if (rejectBtn) {
            event.event.preventDefault();
            handleReject(rejectBtn.dataset.id);
            return;
        }

        const deleteBtn = findButton("delete-btn");
        if (deleteBtn) {
            event.event.preventDefault();
            handleDelete(deleteBtn.dataset.id);
            return;
        }

        if (rawTarget.classList && rawTarget.classList.contains("status-toggle")) {
            const id = rawTarget.dataset.id;
            const user = event.data;
            if (user) {
                event.event.preventDefault();
                if (user.status !== "pending") {
                    const newStatus = user.isActive ? "inactive" : "active";
                    handleStatusToggle(id, newStatus);
                }
            }
        }
    };

    const ActionCell = ({ data }) => {
        const isPending = data.status === "pending";

        if (isPending) {
            return (
                <div style={{ display: "flex", gap: "12px", padding: "4px 0" }}>
                    <button
                        className="approve-btn font-creato"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#16a34a",
                        }}
                        onClick={() => handleApprove(data.id)}
                    >
                        <img src={Icons.adminTable.circleCheck} alt="Approve" width={14} />
                        <span>Approve</span>
                    </button>

                    <button
                        className="reject-btn font-creato"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#dc2626",
                        }}
                        onClick={() => handleReject(data.id)}
                    >
                        <img src={Icons.adminTable.circleClose} alt="Reject" width={14} />
                        <span>Reject</span>
                    </button>
                </div>
            );
        }

        return (
            <div style={{ padding: "4px 0" }}>
                <button
                    className="delete-btn font-creato"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#dc2626",
                    }}
                    onClick={() => handleDelete(data.id)}
                >
                    <img src={Icons.adminTable.deleteIcon} alt="Delete" width={14} />
                    <span style={{ color: "#4D4D4D" }}>Delete User</span>
                </button>
            </div>
        );
    };

    const StatusToggleCell = ({ data }) => {
        const isActive = data.isActive;
        const isPending = data.status === "pending";

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingLeft: "8px",
                    opacity: isPending ? 0.6 : 1,
                }}
            >
                <label
                    style={{
                        position: "relative",
                        width: "26px",
                        height: "16px",
                        cursor: isPending ? "not-allowed" : "pointer",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isActive}
                        disabled={isPending}
                        onChange={() => {
                            if (!isPending) {
                                const newStatus = isActive ? "inactive" : "active";
                                handleStatusToggle(data.id, newStatus);
                            }
                        }}
                        style={{ display: "none" }}
                    />

                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: isActive ? "#3b82f6" : "#cbd5e1",
                            borderRadius: "999px",
                            transition: "0.3s",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                width: "12px",
                                height: "12px",
                                left: isActive ? "12px" : "2px",
                                bottom: "2px",
                                background: "#fff",
                                borderRadius: "50%",
                                transition: "0.3s",
                            }}
                        />
                    </span>
                </label>

                <span
                    className="font-creato"
                    style={{ fontSize: "13px", color: "#64748b" }}
                >
                    {isActive ? "Active" : "Inactive"}
                </span>
            </div>
        );
    };

    // ✅ Added safety check for user
    const RoleCell = ({ data }) => {
        const handleChange = (newRole) => {
            // ✅ Guard against null user
            if (!user?._id) {
                toast.error("User session not loaded. Please refresh the page.");
                return;
            }

            const isSelf = data.id === user._id;
            if (newRole === data.role) return;

            if (isSelf) {
                toast.error("You cannot change your own role");
                return;
            }

            Modal.confirm({
                title: "Change Role",
                content: `Are you sure you want to change role to "${newRole}"?`,
                okText: "Yes",
                cancelText: "No",
                centered: true,
                onOk: async () => {
                    try {
                        await authApi.updateUserRole(data.id, newRole);
                        toast.success("Role updated successfully");
                        fetchUsers();
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to update role");
                    }
                }
            });
        };

        return (
            <Select
                value={data.role}
                style={{ width: 120 }}
                onChange={handleChange}
                disabled={data.status === "pending"}
                options={[
                    { value: "Admin", label: "Admin" },
                    { value: "User", label: "User" }
                ]}
            />
        );
    };

    const columnDefs = useMemo(() => [
        {
            field: "name",
            headerName: "Full Name",
            minWidth: 120,
            flex: 1,
            filter: false,
            sortable: true,
            resizable: false,
        },
        {
            field: "email",
            headerName: "Email",
            minWidth: 220,
            flex: 1,
            filter: false,
            sortable: true,
            resizable: false,
        },
        {
            field: "role",
            headerName: "Role",
            width: 140,
            sortable: false,
            resizable: false,
            cellRenderer: RoleCell,
        },
        {
            field: "phone",
            headerName: "Phone Number",
            width: 140,
            filter: false,
            sortable: true,
            resizable: false,
            suppressSizeToFit: true,
        },
        {
            field: "status",
            headerName: "Status",
            width: 140,
            sortable: false,
            resizable: false,
            suppressSizeToFit: true,
            cellRenderer: StatusToggleCell,
            cellStyle: { display: "flex", alignItems: "center" },
        },
        {
            field: "submittedOn",
            headerName: "Submitted On",
            width: 180,
            filter: false,
            sortable: true,
            resizable: false,
            suppressSizeToFit: true,
        },
        {
            field: "approvedOn",
            headerName: "Approved / Rejected On",
            width: 180,
            filter: false,
            sortable: true,
            resizable: false,
            suppressSizeToFit: true,
        },
        {
            field: "companyType",
            headerName: "Type",
            width: 140,
            filter: false,
            sortable: true,
            resizable: false,
            suppressSizeToFit: true,
        },
        {
            field: "companySize",
            headerName: "Company Size",
            width: 140,
            filter: false,
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
            cellRenderer: ActionCell,
            cellStyle: {
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingLeft: "8px",
            },
        },
    ], [user]);

    const handleCreateUser = () => {
        setIsCreateOpen(true);
    };

    return (
        <>
            <ReusableDataTable
                title="User Management"
                columnDefs={columnDefs}
                data={users}
                fetchData={fetchUsers}
                loading={loading}
                handleCreateUser={handleCreateUser}
                searchPlaceholder="Search loan, borrower etc."
                onCellClicked={handleCellClick}
                showFilter={true}
                onFilter={() => console.log("Filter clicked")}
                defaultPageSize={10}
                pageSizeOptions={[10, 20, 50]}
            />
            {isCreateOpen && (
                <CreateCompanyUserModal
                    open={isCreateOpen}
                    onCancel={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        fetchUsers();
                    }}
                />
            )}
        </>
    );
}