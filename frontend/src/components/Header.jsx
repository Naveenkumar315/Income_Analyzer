import React, { useEffect, useState } from "react";
import { Menu, Badge, Avatar, Dropdown } from "antd";
import {
    DashboardOutlined,
    SearchOutlined,
    SettingOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import logo from "../assets/loandna.png";
import dna_strand from "../assets/dna-strand.svg"
import { useNavigate } from "react-router-dom";
import { clearTokens, getUserData } from "../utils/authService";
import layoutdashboard from "../assets/layout-dashboard.svg"
import settings from "../assets/settings.svg"
import filesearch2 from "../assets/file-search-2.svg"
import scrolltext from "../assets/scroll-text.svg"

const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: layoutdashboard },
    { key: "loan-search", label: "Loan Product Search", icon: filesearch2 },
    { key: "Rules", label: "Rules", icon: scrolltext },
    { key: "settings", label: "Settings", icon: settings },
];

const HelpButton = () => {
    return (
        <button
            className="!mr-4
        h-8 px-3
        flex items-center gap-2 
        rounded-full 
        border border-[#24A1DD]
        text-sm text-gray-600 
        hover:bg-gray-100 
      "
        >
            <span className="text-[#24A1DD]">
                <img src={dna_strand} alt="" width={20} />
            </span>
            <span className="font-creato">How can I help you?</span>
        </button>
    );
};

const ProfileOverlay = ({ onLogout, onAdmin, isAdmin, userData }) => {
    debugger
    // Derive display name/initials
    const email = userData?.email || "";
    const role = userData?.role || "User";
    // Simple logic to get a name-like string or fallback to email
    const displayName = email.split("@")[0] || "User";
    // Title case for name
    const formattedName = displayName.replace(/\./g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="w-[260px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden font-creato">
            {/* Decorative Header Background */}
            <div className="h-24 bg-gradient-to-r from-[#e6f7ff] to-[#f0f5ff] relative overflow-hidden">
                <img
                    src={dna_strand}
                    alt=""
                    className="absolute top-[-20%] right-[-10%] w-32 opacity-30 rotate-12"
                />
            </div>

            {/* Content Container - Negative margin to pull avatar up */}
            <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="flex justify-center -mt-10 mb-3">
                    <div className="bg-white p-1 rounded-2xl shadow-sm">
                        <Avatar
                            size={80}
                            className="!bg-[#f5f5f5] !text-gray-600 !text-3xl !rounded-xl border border-gray-100 flex items-center justify-center font-creato"
                        >
                            {formattedName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </Avatar>
                    </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{formattedName}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm">
                        <SafetyCertificateOutlined />
                        <span className="capitalize">{role === 'admin' ? 'Master Admin' : role}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                    {/* Only show Admin Page for admin users */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onAdmin}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                            <TeamOutlined className="text-lg text-gray-400 group-hover:text-gray-600" />
                            <span className="text-sm font-medium">Users Management</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#ff4d4f] hover:bg-[#fff1f0] rounded-lg transition-colors group"
                    >
                        <LogoutOutlined className="text-lg" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function Header() {

    const [selectedKey, setSelectedKey] = useState("dashboard");
    const navigate = useNavigate();

    // Get user role from session storage
    const userData = getUserData();
    const isAdmin = userData.role === "admin";

    const handleLogout = () => {
        console.log("logout clicked");
        // Clear all tokens from session storage
        clearTokens();
        // redirect to login page
        navigate("/");
    };

    const handleAdmin = () => {
        debugger
        console.log("admin clicked");
        if (typeof navigate === "function") {
            setSelectedKey("")
            return navigate("/admin");
        } else {
            // fallback
            window.location.href = "/admin";
        }
    };

    useEffect(() => {
        console.log("===================>", selectedKey)
        if (selectedKey === "dashboard") {
            navigate('/home')
        }
    }, [selectedKey, navigate])

    // custom overlay element for Dropdown
    const overlay = (
        <ProfileOverlay
            onLogout={() => { dropdownClose(); handleLogout(); }}
            onAdmin={() => { dropdownClose(); handleAdmin(); }}
            isAdmin={isAdmin}
            userData={userData}
        />
    );

    // control dropdown programmatically so we can close it after click
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownClose = () => setDropdownOpen(false);
    const dropdownOpenToggle = (open) => setDropdownOpen(open);

    return (
        <header className="w-full bg-white shadow-sm"> {/* bottom shadow kept */}
            <div className="w-full flex items-center h-12"> {/* header height reduced */}
                {/* LEFT LOGO BLOCK — only RIGHT border */}
                <div className="h-12 px-3 border-r border-gray-200 flex items-center justify-center">
                    <img
                        src={logo}
                        alt="logo"
                        className="w-32 h-12 object-contain" /* adjust width if needed */
                        loading="lazy"
                    />
                </div>

                {/* MENU */}
                <div className="flex-1 flex items-center">
                    <Menu
                        mode="horizontal"
                        selectedKeys={[selectedKey]}
                        onClick={(e) => setSelectedKey(e.key)}
                        className="flex-1 bg-transparent border-none !h-12 flex items-center"
                        items={menuItems.map((it) => ({
                            key: it.key,
                            label: (
                                <div
                                    className={`
                    h-12 px-1 
                    inline-flex items-center  
                    border-b-2
                    ${selectedKey === it.key ? "border-[#24A1DD]" : "border-transparent"}
                  `}
                                >
                                    <div className="w-5 mr-2 h-5 flex items-center justify-center">
                                        <img src={it.icon} alt="" className="w-5 h-5 object-contain" />
                                    </div>
                                    <span className="text-sm font-normal">{it.label}</span>
                                </div>
                            ),
                        }))}
                    />
                </div>

                <HelpButton />
                {/* RIGHT BLOCK — border-left wraps HelpButton + Notification + Avatar */}
                <div className="h-12 flex items-center gap-3 border-l border-gray-200 pl-3 pr-3">

                    <Badge count={3} size="small" offset={[0, 0]}>
                        <BellOutlined className="text-base cursor-pointer" />
                    </Badge>

                    <Dropdown
                        trigger={["click"]}
                        placement="bottomRight"
                        open={dropdownOpen}
                        onOpenChange={dropdownOpenToggle}
                        arrow={false}
                        dropdownRender={() => overlay}
                    >
                        <div aria-haspopup="true" aria-expanded={dropdownOpen} role="button" tabIndex={0}>
                            <Avatar size={28} icon={<UserOutlined />} className="cursor-pointer" />
                        </div>
                    </Dropdown>

                </div>
            </div>
        </header>
    );
}
