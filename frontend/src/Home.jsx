// Home.jsx - Fix the useEffect to check sessionStorage
import React, { useEffect } from "react";
import useApp from "antd/es/app/useApp";
import useRefreshUser from "./hooks/useRefreshUser";

const Home = () => {
    const { user, setUser } = useApp()
    const { refreshUser } = useRefreshUser();


    useEffect(() => {
        refreshUser()
    }, [user])

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
            </main>
        </div>
    );
};

export default Home;