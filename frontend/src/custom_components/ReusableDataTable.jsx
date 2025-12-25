import React, { useMemo, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { SearchOutlined } from "@ant-design/icons";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import CustomButton from "../components/CustomButton";

// AG Grid v33+
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ReusableDataTable({
    title = "Data Table",
    columnDefs = [],
    handleCreateUser,
    data = [],
    loading = false,
    searchPlaceholder = "Search...",
    onSearch = null,
    onFilter = null,
    showFilter = false,
    defaultPageSize = 10,
    pageSizeOptions = [10, 20, 50],
    onCellClicked = null,
}) {
    const gridRef = useRef(null);
    const [gridApi, setGridApi] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    /* ---------- SEARCH ---------- */
    const filteredData = useMemo(() => {
        if (onSearch) return onSearch(data, searchText);
        if (!searchText) return data;

        const s = searchText.toLowerCase();
        return data.filter((row) =>
            Object.values(row).some((v) =>
                String(v ?? "").toLowerCase().includes(s)
            )
        );
    }, [data, searchText, onSearch]);

    /* ---------- GRID READY ---------- */
    const onGridReady = (params) => {
        setGridApi(params.api);

        params.api.setGridOption("paginationPageSize", pageSize);

        params.api.addEventListener("paginationChanged", () => {
            setCurrentPage(params.api.paginationGetCurrentPage() + 1);
        });
    };

    if (loading) {
        return (
            <div style={{ padding: 32, background: "#f8fafc" }}>
                <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: "#f8fafc",
                minHeight: "calc(100dvh - 48px)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* ================= HEADER ================= */}
            <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>

                <div
                    style={{
                        width: 60,
                        height: 32,
                        borderRadius: 999,
                        background: "#E0E0E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {filteredData.length}
                </div>

                {/* Search */}
                <div style={{ position: "relative", width: 360 }}>
                    <SearchOutlined
                        style={{
                            position: "absolute",
                            left: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={searchPlaceholder}
                        style={{
                            width: "100%",
                            padding: "10px 14px 10px 42px",
                            borderRadius: 8,
                            border: "1px solid #E0E0E0",
                        }}
                    />
                </div>

                {showFilter && (
                    <div>
                        <CustomButton
                            className={`mt-0 cursor-pointer`}
                            variant={"primary"}
                            type="button"
                            onClick={handleCreateUser}
                        >
                            Create New User
                            {/* <img
                                              src={
                                                isEmailValid
                                                  ? "/arrow-right-active.png"
                                                  : "/arrow-right.svg"
                                              }
                                              alt=""
                                              className="w-4 h-4"
                                            /> */}
                        </CustomButton>
                    </div>
                )}
            </div>
            <div
                style={{
                    background: "white",
                    borderRadius: 8,
                    border: "1px solid #eee",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    className="ag-theme-alpine"
                    style={{
                        width: "100%",
                        height:
                            `${Math.max(
                                1,
                                Math.min(pageSize, filteredData.length - (currentPage - 1) * pageSize)
                            ) * 48 + 50}px`,
                        maxHeight: "calc(100vh - 280px)",
                        transition: "height 0.2s",
                        minHeight: 150,
                    }}
                >
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={columnDefs}
                        rowData={filteredData}
                        defaultColDef={{
                            sortable: true,
                            filter: false,
                            resizable: false,
                            suppressMenu: true,
                        }}
                        pagination
                        suppressPaginationPanel
                        rowHeight={48}
                        headerHeight={48}
                        suppressCellFocus
                        onCellClicked={onCellClicked}
                        onGridReady={onGridReady}
                        theme="legacy"
                    />
                </div>

                {/* ================= OLD CUSTOM FOOTER (UNCHANGED UI) ================= */}
                {filteredData.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderTop: "1px solid #e5e7eb",
                            background: "white",
                        }}
                    >
                        {/* Left */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14 }}>Items per page:</span>

                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                    if (gridApi) {
                                        gridApi.setGridOption("paginationPageSize", newSize);
                                        gridApi.paginationGoToPage(0);
                                    }
                                }}
                            >
                                {pageSizeOptions.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <span style={{ fontSize: 14, color: "#9ca3af" }}>
                                {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}
                                {" - "}
                                {Math.min(currentPage * pageSize, filteredData.length)}
                                {" of "}
                                {filteredData.length} items
                            </span>
                        </div>

                        {/* Right */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {Array.from(
                                { length: Math.ceil(filteredData.length / pageSize) },
                                (_, i) => i + 1
                            ).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setCurrentPage(p);
                                        gridApi?.paginationGoToPage(p - 1);
                                    }}
                                    style={{
                                        minWidth: 36,
                                        height: 36,
                                        border: "none",
                                        borderRadius: 6,
                                        background: currentPage === p ? "#3b82f6" : "transparent",
                                        color: currentPage === p ? "white" : "#374151",
                                        cursor: "pointer",
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
