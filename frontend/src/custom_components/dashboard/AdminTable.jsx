// AdminTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    SearchOutlined,
} from "@ant-design/icons";

// Sample rows
const makeRow = (i) => ({
    id: i,
    name: `Company ${i}`,
    email: `company${i}@example.com`,
    phone: `(800) 555-${String(1000 + i).slice(1)}`,
    address: `${i} Main St, Springfield`,
    submittedOn: `2025-11-${String((i % 28) + 1).padStart(2, "0")}`,
    approvedOn: i % 3 === 0 ? `2025-11-${String((i % 28) + 1).padStart(2, "0")}` : null,
    companyType: i % 2 === 0 ? "Broker Company" : "Broker",
    companySize: i % 10,
    active: i % 4 === 0,
    action: i % 5 === 0 ? "Approved" : null
});
const SAMPLE = Array.from({ length: 60 }).map((_, i) => makeRow(i + 1));

export default function AdminTable({ data = SAMPLE }) {
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState("");
    const [gridApi, setGridApi] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        // Load AG Grid CSS
        const cssLinks = [
            'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-grid.css',
            'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/styles/ag-theme-alpine.css'
        ];

        cssLinks.forEach(href => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        });

        // Load AG Grid JS
        if (!window.agGrid) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.0/dist/ag-grid-community.min.js';
            script.onload = () => {
                console.log('AG Grid loaded');
                setIsLoaded(true);
            };
            script.onerror = () => {
                console.error('Failed to load AG Grid');
            };
            document.body.appendChild(script);
        } else {
            setIsLoaded(true);
        }
    }, []);

    const columnDefs = useMemo(
        () => [
            {
                field: "name",
                headerName: "Name",
                width: 200,
                filter: true,
                sortable: true
            },
            {
                field: "email",
                headerName: "Email",
                width: 250,
                cellRenderer: (params) => {
                    return `<a href="mailto:${params.value}" style="color: #2563eb; text-decoration: none;">${params.value}</a>`;
                },
                filter: true,
                sortable: true
            },
            {
                field: "phone",
                headerName: "Phone",
                width: 140,
                filter: true,
                sortable: true
            },
            {
                field: "address",
                headerName: "Address",
                width: 240,
                filter: true,
                sortable: true
            },
            {
                field: "submittedOn",
                headerName: "Submitted On",
                width: 160,
                filter: true,
                sortable: true
            },
            {
                field: "approvedOn",
                headerName: "Approved / Rejected On",
                width: 200,
                filter: true,
                sortable: true,
                valueFormatter: (params) => params.value || "-"
            },
            {
                field: "companyType",
                headerName: "Company Type",
                width: 150,
                filter: true,
                sortable: true
            },
            {
                field: "companySize",
                headerName: "Company Size",
                width: 130,
                filter: true,
                sortable: true,
                cellStyle: { textAlign: "center" }
            },
            {
                field: "active",
                headerName: "Active",
                width: 110,
                filter: true,
                sortable: true,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) => params.value ? "Yes" : "No"
            },
            // === UPDATED ACTION COLUMN ===
            {
                field: "action",
                headerName: "Action",
                width: 180,
                pinned: "right",
                cellRenderer: (params) => {
                    if (params.value) {
                        return `<div style="color: #15803d; font-weight: 600; text-align: center; line-height: 48px;">${params.value}</div>`;
                    }

                    return `
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center; height: 100%;">
                            <a href="#" class="approve-link" data-id="${params.data.id}"
                               style="color: #15803d; font-weight: 600; text-decoration: none; cursor: pointer;">
                                Approve
                            </a>

                            <span style="color: #9ca3af;">|</span>

                            <a href="#" class="reject-link" data-id="${params.data.id}"
                               style="color: #b91c1c; font-weight: 600; text-decoration: none; cursor: pointer;">
                                Reject
                            </a>
                        </div>
                    `;
                },
                cellStyle: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }
            }
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchText) return data;

        const search = searchText.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(search)
            )
        );
    }, [data, searchText]);

    useEffect(() => {
        if (isLoaded && gridRef.current && window.agGrid && !gridApi) {
            console.log('Initializing grid...');

            const gridOptions = {
                columnDefs: columnDefs,
                rowData: filteredData,
                defaultColDef: {
                    resizable: true,
                    suppressMenu: true
                },
                pagination: true,
                paginationPageSize: pageSize,
                suppressPaginationPanel: true,
                domLayout: 'normal',
                rowHeight: 48,
                headerHeight: 48,
                suppressCellFocus: true,
                onGridReady: (params) => {
                    console.log('Grid ready');
                    setGridApi(params.api);
                    params.api.addEventListener('paginationChanged', () => {
                        setCurrentPage(params.api.paginationGetCurrentPage() + 1);
                    });
                },
                onCellClicked: (event) => {
                    const target = event.event.target;

                    // Approve link clicked
                    if (target.classList && target.classList.contains("approve-link")) {
                        const id = target.dataset.id;
                        console.log("Approve", id);
                        event.event.preventDefault();
                        // TODO: call API or update state to mark as approved
                        return;
                    }

                    // Reject link clicked
                    if (target.classList && target.classList.contains("reject-link")) {
                        const id = target.dataset.id;
                        console.log("Reject", id);
                        event.event.preventDefault();
                        // TODO: call API or update state to mark as rejected
                        return;
                    }
                }
            };

            window.agGrid.createGrid(gridRef.current, gridOptions);
        }
    }, [isLoaded, columnDefs, filteredData, gridApi, pageSize]);

    // Update grid rows when filteredData changes
    useEffect(() => {
        if (gridApi) {
            try {
                gridApi.setRowData(filteredData);
            } catch (err) {
                // fallback for older ag-grid versions
                gridApi.setGridOption && gridApi.setGridOption('rowData', filteredData);
            }
        }
    }, [filteredData, gridApi]);

    if (!isLoaded) {
        return (
            <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
                <div style={{ textAlign: 'center', padding: 40 }}>Loading AG Grid...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 24 }}>
                Heading
            </h2>

            {/* Search Box */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <div
                    style={{
                        position: "relative",
                        width: 360,
                        borderRadius: 8,
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }}
                >
                    <SearchOutlined
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 14,
                            transform: "translateY(-50%)",
                            color: "#9CA3AF",
                        }}
                    />
                    <input
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            padding: "10px 14px 10px 42px",
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                    />
                </div>
            </div>

            {/* AG Grid */}
            <div style={{
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                border: "1px solid #eee",
                background: 'white'
            }}>
                <style>{`
          .ag-theme-alpine .ag-header {
            background: #11699e !important;
            border-bottom: 1px solid #0e5680;
          }
          .ag-theme-alpine .ag-header-cell {
            color: white !important;
            font-weight: 600;
          }
          .ag-theme-alpine .ag-header-cell-text {
            color: white !important;
          }
          .ag-theme-alpine .ag-row-even {
            background: white;
          }
          .ag-theme-alpine .ag-row-odd {
            background: #f9fafb;
          }
          .ag-theme-alpine .ag-row-hover {
            background: #eff6ff !important;
          }
          .ag-theme-alpine .ag-cell {
            border-bottom: 1px solid #f1f5f9;
          }
          .ag-theme-alpine .ag-pinned-right-header {
            border-left: 1px solid #0e5680;
          }
          .ag-theme-alpine .ag-pinned-right-cols-container .ag-cell {
            border-left: 1px solid #eee;
          }
          .ag-theme-alpine .ag-root-wrapper {
            border: none;
          }
        `}</style>
                <div
                    ref={gridRef}
                    className="ag-theme-alpine"
                    style={{ height: 550, width: '100%' }}
                />

                {/* Custom Pagination */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #e5e7eb',
                    background: 'white'
                }}>
                    {/* Left Side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: 500
                        }}>Items per page:</span>

                        <div style={{ position: 'relative' }}>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                    if (gridApi) {
                                        gridApi.paginationSetPageSize(newSize);
                                        gridApi.paginationGoToPage(0);
                                    }
                                }}
                                style={{
                                    appearance: 'none',
                                    padding: '6px 32px 6px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    minWidth: '70px',
                                    color: '#374151'
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                fontSize: '12px',
                                color: '#6b7280'
                            }}>▼</span>
                        </div>

                        <span style={{
                            fontSize: '14px',
                            color: '#9ca3af',
                            marginLeft: '8px'
                        }}>
                            {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} items
                        </span>
                    </div>

                    {/* Right Side - Page Numbers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(() => {
                            const totalPages = Math.ceil(filteredData.length / pageSize);
                            const pages = [];

                            // Always show first page
                            pages.push(1);

                            // Show pages around current page
                            if (currentPage > 3) {
                                pages.push('...');
                            }

                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                if (!pages.includes(i)) {
                                    pages.push(i);
                                }
                            }

                            // Show ellipsis before last page if needed
                            if (currentPage < totalPages - 2) {
                                pages.push('...');
                            }

                            // Always show last page if more than 1 page
                            if (totalPages > 1 && !pages.includes(totalPages)) {
                                pages.push(totalPages);
                            }

                            return pages.map((page, idx) => {
                                if (page === '...') {
                                    return (
                                        <span key={`ellipsis-${idx}`} style={{
                                            padding: '6px 8px',
                                            fontSize: '14px',
                                            color: '#9ca3af'
                                        }}>...</span>
                                    );
                                }

                                const isFirstThree = page <= 3;
                                const isActive = currentPage === page;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => {
                                            setCurrentPage(page);
                                            if (gridApi) {
                                                gridApi.paginationGoToPage(page - 1);
                                            }
                                        }}
                                        style={{
                                            minWidth: '36px',
                                            height: '36px',
                                            padding: '6px 12px',
                                            fontSize: '14px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: isActive ? '#3b82f6' : (isFirstThree ? '#e0f2fe' : 'transparent'),
                                            color: isActive ? 'white' : '#374151',
                                            cursor: 'pointer',
                                            fontWeight: isActive ? 600 : 400,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.target.style.background = isFirstThree ? '#bae6fd' : '#f3f4f6';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.target.style.background = isFirstThree ? '#e0f2fe' : 'transparent';
                                            }
                                        }}
                                    >
                                        {page}
                                    </button>
                                );
                            });
                        })()}

                        {/* Navigation Arrows */}
                        <div style={{
                            width: '1px',
                            height: '24px',
                            background: '#e5e7eb',
                            margin: '0 8px'
                        }} />

                        <button
                            onClick={() => {
                                if (currentPage > 1) {
                                    const newPage = currentPage - 1;
                                    setCurrentPage(newPage);
                                    if (gridApi) {
                                        gridApi.paginationGoToPage(newPage - 1);
                                    }
                                }
                            }}
                            disabled={currentPage === 1}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                color: currentPage === 1 ? '#d1d5db' : '#374151',
                                fontSize: '24px',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            ‹
                        </button>

                        <button
                            onClick={() => {
                                const totalPages = Math.ceil(filteredData.length / pageSize);
                                if (currentPage < totalPages) {
                                    const newPage = currentPage + 1;
                                    setCurrentPage(newPage);
                                    if (gridApi) {
                                        gridApi.paginationGoToPage(newPage - 1);
                                    }
                                }
                            }}
                            disabled={currentPage === Math.ceil(filteredData.length / pageSize)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: currentPage === Math.ceil(filteredData.length / pageSize) ? 'not-allowed' : 'pointer',
                                color: currentPage === Math.ceil(filteredData.length / pageSize) ? '#d1d5db' : '#374151',
                                fontSize: '24px',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
