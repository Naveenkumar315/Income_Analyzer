import React, { useEffect, useState } from "react";
import { Menu, Badge, Avatar, Dropdown } from "antd";
import {
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { clearTokens, getUserData } from "../utils/authService";
import { Icons } from "../utils/icons.js";
import { useApp } from "../contexts/AppContext.jsx";


//    CONFIGURABLE MENU – change only here
const MENU_CONFIG = [
    {
        key: "dashboard",
        label: "Dashboard",
        route: "/dashboard",
        icon: Icons.dashboard.default,
        activeIcon: Icons.dashboard.active
    },
    {
        key: "income-analyzer",
        label: "Income Analyzer",
        route: "/income-analyzer",
        icon: Icons.incomeAnalyzer.default,
        activeIcon: Icons.incomeAnalyzer.active
    },
    {
        key: "rules",
        label: "Rules",
        route: "/rules",
        icon: Icons.rules.default,
        activeIcon: Icons.rules.active
    },
    {
        key: "user-management",
        label: "User Management",
        route: "/users",
        icon: Icons.users.default,
        activeIcon: Icons.users.active,
        admin: true
    },
];


//    HELP BUTTON
const HelpButton = () => (
    <button
        className="!mr-4 h-8 px-3 flex items-center gap-2 rounded-full border border-[#24A1DD]
               text-sm text-gray-600 hover:bg-gray-100"
    >
        <span className="text-[#24A1DD]">
            <img src={Icons.header.dna_strand} alt="" width={20} />
        </span>
        <span className="font-creato">How can I help you?</span>
    </button>
);

//    PROFILE DROPDOWN
const ProfileOverlay = ({ onLogout, onAdmin, isAdmin, userData }) => {
    const { user } = useApp()
    
    const username = userData?.username || "User";
    let role = userData?.role || "User";
    
    if (user?.type === "global_admin") {
        role = "Master Admin"
    }
    
    const formattedName = username.replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <div className="w-[260px] bg-white mt-1.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden font-creato">
            <div className="h-24 bg-gradient-to-r from-[#e6f7ff] to-[#f0f5ff] relative overflow-hidden">
                <img src={Icons.header.dna_strand} alt="" className="absolute top-[-20%] right-[-10%] w-32 opacity-30 rotate-12" />
            </div>

            <div className="px-6 pb-6 relative">
                <div className="flex justify-center -mt-10 mb-3">
                    <div className="bg-white p-1 rounded-2xl shadow-sm">
                        <Avatar
                            size={80}
                            className="!bg-[#f5f5f5] !text-gray-600 !text-3xl !rounded-xl border"
                        >
                            {formattedName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                        </Avatar>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{formattedName}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm">
                        <SafetyCertificateOutlined />
                        <span className="capitalize">{role}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onAdmin}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                            <TeamOutlined className="text-lg" />
                            <span className="text-sm font-medium">Users Management</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#fff1f0] rounded-lg cursor-pointer"
                    >
                        <LogoutOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
                        <span className="text-sm font-medium" style={{ color: "#ff4d4f" }} >Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

//    MAIN HEADER
export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // const userData = getUserData();
    // const { user, setUser } = useApp();

    // useEffect(() => {
    //     const data = getUserData();
    //     if (!data) return;

    //     setUser({
    //         ...data,
    //         role: data.role?.toLowerCase(),
    //         type: data.type?.toLowerCase(),
    //     });
    // }, []);

    const { user } = useApp();

    const userData = user;
    const isAdmin = userData?.role === "Admin";

    const username = userData?.username || "User";

    const avatarText = username
        .replace(/\./g, " ")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // ADMIN FILTER
    const menuItems = MENU_CONFIG.filter((item) => !item.admin || isAdmin);

    // SELECTED KEY FROM URL 
    const selectedKeyFromPath =
        menuItems.find((item) =>
            location.pathname === item.route ||
            location.pathname.startsWith(item.route + "/")
        )?.key || "";


    const [selectedKey, setSelectedKey] = useState(selectedKeyFromPath);

    useEffect(() => {
        setSelectedKey(selectedKeyFromPath);
    }, [location.pathname]);

    //   LOGOUT 
    const handleLogout = () => {
        clearTokens();
        navigate("/");
    };

    useEffect(() => {
        console.log({ user });

    }, [user])

    //  ADMIN PAGE 
    const handleAdmin = () => navigate("/users");

    //  DROPDOWN CONTROL
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownClose = () => setDropdownOpen(false);

    return (
        <>
            {dropdownOpen && (
                <div
                    className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[999]"
                    style={{ top: "48px" }}
                    onClick={dropdownClose}
                />
            )}

            <header className="w-full bg-white shadow-sm relative z-[1000]">
                <div className="w-full flex items-center h-12">

                    {/* LOGO */}
                    <div className="h-12 px-3 border-r border-gray-200 flex items-center justify-center">
                        <img src={Icons.header.logo} alt="logo" className="w-32 h-12 object-contain" />
                    </div>

                    {/* MENU */}
                    <div className="flex-1 flex items-center">
                        <Menu
                            mode="horizontal"
                            selectedKeys={[selectedKey]}
                            onClick={(e) => {
                                setSelectedKey(e.key);
                                const target = menuItems.find((m) => m.key === e.key);
                                if (target) navigate(target.route);
                            }}
                            className="flex-1 bg-transparent border-none !h-12 flex items-center"
                            items={menuItems.map((it) => ({
                                key: it.key,
                                label: (
                                    <div className="h-12 px-1 inline-flex items-center">
                                        <img src={selectedKey === it.key ? it.activeIcon : it.icon} className="w-5 h-5 mr-2" alt="" />
                                        <span className="text-sm">{it.label}</span>
                                    </div>
                                ),
                            }))}
                        />
                    </div>
                    <HelpButton />

                    {/* RIGHT SIDE */}
                    <div className="h-12 flex items-center gap-3 border-l border-gray-200 pl-3 pr-3">
                        <Badge count={3} size="small">
                            <BellOutlined className="text-base cursor-pointer" />
                        </Badge>

                        <Dropdown
                            trigger={["click"]}
                            placement="bottomRight"
                            open={dropdownOpen}
                            onOpenChange={setDropdownOpen}
                            arrow={false}
                            popupRender={() => (
                                <ProfileOverlay
                                    onLogout={() => {
                                        dropdownClose();
                                        handleLogout();
                                    }}
                                    onAdmin={() => {
                                        dropdownClose();
                                        handleAdmin();
                                    }}
                                    isAdmin={isAdmin}
                                    userData={userData}
                                />
                            )}
                        >
                            <div>
                                <Avatar
                                    size={30}
                                    className="!bg-[#24A1DD] !text-white custom-font-jura font-semibold cursor-pointer"
                                >
                                    {avatarText}
                                </Avatar>
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </header>
        </>
    );
}
