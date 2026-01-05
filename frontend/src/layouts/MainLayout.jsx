// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <main style={{ padding: 14 }}>
                <Outlet />
            </main>
        </div>
    );
}
