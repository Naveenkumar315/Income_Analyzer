import React, { useState } from "react";
import { Menu, Avatar, Badge, Space } from "antd";
import {
    DashboardOutlined,
    SearchOutlined,
    SettingOutlined,
    BellOutlined,
    UserOutlined,
} from "@ant-design/icons";

/**
 * Header component using Tailwind + Ant Design
 * - Replace logoSrc with your logo path
 * - Menu selection controlled by state (selectedKey)
 */

const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { key: "loan-search", label: "Loan Product Search", icon: <SearchOutlined /> },
    { key: "settings", label: "Settings", icon: <SettingOutlined /> },
];

const Header = ({ logoSrc = "/your-logo.png" }) => {
    const [selectedKey, setSelectedKey] = useState("dashboard");

    return (
        <header className="w-full bg-white shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex items-center pr-6">
                        <div className="flex items-center gap-3">
                            <img
                                src={logoSrc}
                                alt="logo"
                                className="h-8 w-auto object-contain"
                            />
                            {/* small left blue tick/underline on very left like screenshot */}
                            <div className="w-1 h-8 bg-blue-500 rounded-r-sm" />
                        </div>
                    </div>

                    {/* Middle: Menu */}
                    <nav className="flex-1">
                        <div className="flex items-center h-full">
                            <Menu
                                mode="horizontal"
                                selectedKeys={[selectedKey]}
                                onClick={(e) => setSelectedKey(e.key)}
                                className="w-full bg-transparent flex items-center"
                                items={menuItems.map((it) => ({
                                    key: it.key,
                                    label: (
                                        <div
                                            className={`flex items-center gap-2 px-4 py-2 transition-all ${selectedKey === it.key ? "border-b-4 border-blue-500" : ""
                                                }`}
                                        >
                                            {it.icon}
                                            <span className="text-sm">{it.label}</span>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>
                    </nav>

                    {/* Vertical dotted divider */}
                    <div className="mx-4 h-8 border-l-2 border-dashed border-slate-300" />

                    {/* Right: Notifications + Avatar */}
                    <div className="flex items-center">
                        <Space size="middle" className="pr-2">
                            <Badge count={3} size="small">
                                <BellOutlined className="text-xl cursor-pointer" />
                            </Badge>
                            <div className="flex items-center gap-2">
                                <Avatar
                                    size="small"
                                    icon={<UserOutlined />}
                                    src={null}
                                    style={{ cursor: "pointer" }}
                                />
                            </div>
                        </Space>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
