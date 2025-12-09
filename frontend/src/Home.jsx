import React from "react";
import Header from "./components/Header";
import AdminTable from "./custom_components/dashboard/AdminTable";

const Home = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* <Header logoSrc="/path/to/your/logo.png" /> */}
            <main className="p-6">
                {/* rest of page */}
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <AdminTable />
            </main>
        </div>
    );
};

export default Home;
