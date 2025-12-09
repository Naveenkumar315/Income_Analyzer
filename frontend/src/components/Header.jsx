import React, { useState } from "react";
import { Menu, Badge, Avatar, Dropdown } from "antd";
import {
    DashboardOutlined,
    SearchOutlined,
    SettingOutlined,
    BellOutlined,
    UserOutlined,
} from "@ant-design/icons";
import logo from "../assets/loandna.png";
import dna_strand from "../assets/dna-strand.svg"
import { useNavigate } from "react-router-dom";

const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { key: "loan-search", label: "Loan Product Search", icon: <SearchOutlined /> },
    { key: "settings", label: "Settings", icon: <SettingOutlined /> },
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

const ProfileOverlay = ({ onLogout, onAdmin, isAdmin }) => {
    return (
        <div className="min-w-[170px] bg-white rounded-md shadow-lg p-2">
            {/* top: Logout */}
            <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-3 py-2 font-creato rounded-md hover:bg-gray-50 text-sm text-gray-700"
            >
                Logout
            </button>

            {/* Only show Admin Page for admin users */}
            {isAdmin && (
                <>
                    {/* divider */}
                    <div className="my-1 border-t border-gray-100" />

                    {/* bottom: Admin Page */}
                    <button
                        type="button"
                        onClick={onAdmin}
                        className="w-full text-left px-3 py-2 font-creato rounded-md hover:bg-gray-50 text-sm text-gray-700"
                    >
                        Admin Page
                    </button>
                </>
            )}
        </div>
    );
};


export default function Header() {

    const [selectedKey, setSelectedKey] = useState("dashboard");
    const navigate = useNavigate();

    // Check if user is admin
    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "admin";

    const handleLogout = () => {
        // Add your logout logic here.
        // Example: clear localStorage, call API, then redirect to login.
        console.log("logout clicked");
        try {
            // clear local state
            localStorage.removeItem("authToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
        } catch (e) { }
        // redirect to login page
        navigate("/");
    };

    const handleAdmin = () => {
        console.log("admin clicked");
        if (typeof navigate === "function") {
            navigate("/admin");
        } else {
            // fallback
            window.location.href = "/admin";
        }
    };

    // custom overlay element for Dropdown
    const overlay = (
        <ProfileOverlay
            onLogout={() => { dropdownClose(); handleLogout(); }}
            onAdmin={() => { dropdownClose(); handleAdmin(); }}
            isAdmin={isAdmin}
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
                    h-12 px-3 
                    inline-flex items-center  
                    border-b-2
                    ${selectedKey === it.key ? "border-[#24A1DD]" : "border-transparent"}
                  `}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        {it.icon}
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
