import React, { useState, useMemo } from 'react';
import { Layout, Button, Tabs, Breadcrumb } from 'antd';
import {
    ExpandAltOutlined,
    ArrowLeftOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronUp, Folder, FileText, User, UserPlus, Plus, Upload, X } from 'lucide-react';
import { Tooltip } from "antd";


const { Sider, Content } = Layout;

import CustomButton from '../components/CustomButton';
import { Icons } from '../utils/icons';
import ReusableDataTable from '../custom_components/ReusableDataTable';
import { MergeModal, MoveModal } from './SelectionModals';
import { useLoanDataManagement } from './useLoanDataManagement';

export default function LoanDocumentScreen({ files }) {
    const [activeDocumentTab, setActiveDocumentTab] = useState(null);
    const [activeInnerTab, setActiveInnerTab] = useState('summary');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [expandedBorrowers, setExpandedBorrowers] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [selectionType, setSelectionType] = useState(null);

    const {
        selectedBorrowers,
        setSelectedBorrowers,
        handleMerge,
        selectedFiles,
        setSelectedFiles,
        handleMove
    } = useLoanDataManagement();




    // Process the cleaned data into structured format
    const processedData = useMemo(() => {
        if (!files?.cleaned_data) return { borrowers: [], allDocuments: {} };

        const cleanedData = files.cleaned_data;
        const borrowersMap = {};
        const allDocumentsMap = {};

        // Iterate through the cleaned data structure
        Object.entries(cleanedData).forEach(([borrowerKey, borrowerData]) => {
            const borrowerName = borrowerKey;
            const borrowerId = borrowerKey.replace(/\s+/g, '-').toLowerCase();

            if (!borrowersMap[borrowerId]) {
                borrowersMap[borrowerId] = {
                    id: borrowerId,
                    name: borrowerName,
                    documents: []
                };
            }

            // Process document categories for this borrower
            Object.entries(borrowerData).forEach(([categoryKey, categoryData]) => {
                const categoryName = categoryKey;

                if (Array.isArray(categoryData) && categoryData.length > 0) {
                    // Add document category to borrower
                    const docId = `${borrowerId}-${categoryKey}`;
                    borrowersMap[borrowerId].documents.push({
                        id: docId,
                        name: categoryName,
                        count: categoryData.length,
                        type: 'folder',
                        categoryKey: categoryKey,
                        borrowerId: borrowerId,
                        borrowerName: borrowerName,
                        data: categoryData
                    });

                    // Store documents data for rendering
                    categoryData.forEach((record, index) => {
                        const tabKey = `${docId}-${index}`;
                        allDocumentsMap[tabKey] = {
                            ...record,
                            borrowerId,
                            borrowerName,
                            categoryKey,
                            categoryName,
                            index,
                            label: `${categoryName} ${index + 1}`,
                            recordId: tabKey
                        };
                    });
                }
            });
        });

        return {
            borrowers: Object.values(borrowersMap),
            allDocuments: allDocumentsMap
        };
    }, [files]);

    const { borrowers, allDocuments } = processedData;

    // Set initial states after data is processed
    React.useEffect(() => {
        if (borrowers.length > 0 && !expandedBorrowers.length) {
            setExpandedBorrowers([borrowers[0].id]);
        }

        const docKeys = Object.keys(allDocuments);
        if (docKeys.length > 0 && !activeDocumentTab) {
            setActiveDocumentTab(docKeys[0]);
        }
    }, [borrowers, allDocuments]);

    // Generate document tabs dynamically
    const documentTabs = useMemo(() => {
        if (!selectedDocument || !selectedDocument.data) return [];

        return selectedDocument.data.map((_, index) => ({
            key: `${selectedDocument.id}-${index}`,
            label: (
                <span className="flex items-center gap-2">
                    <img
                        src={activeDocumentTab === `${selectedDocument.id}-${index}`
                            ? Icons.loanDocument.fileActive
                            : Icons.loanDocument.fileInactive}
                        alt=""
                        className="w-5 h-5"
                    />
                    {selectedDocument.name} {index + 1}
                </span>
            )
        }));
    }, [selectedDocument, activeDocumentTab]);

    // Get current document data
    const currentDocumentData = useMemo(() => {
        if (!activeDocumentTab || !allDocuments[activeDocumentTab]) return null;
        return allDocuments[activeDocumentTab];
    }, [activeDocumentTab, allDocuments]);

    // Helper function to check if value is an array
    const isArrayData = (value) => {
        return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object';
    };

    // Extract summary data (non-array fields) and nested array keys
    const { summaryData, nestedArrayKeys } = useMemo(() => {
        if (!currentDocumentData) return { summaryData: [], nestedArrayKeys: [] };

        const details = [];
        const arrayKeys = [];

        Object.entries(currentDocumentData).forEach(([key, value]) => {
            if (key !== 'borrowerId' && key !== 'categoryKey' &&
                key !== 'index' && key !== 'label' && key !== 'recordId' &&
                key !== 'borrowerName' && key !== 'categoryName') {

                if (isArrayData(value)) {
                    // Store array field keys for dynamic tabs
                    arrayKeys.push({
                        key: key,
                        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        data: value
                    });
                } else {
                    // Regular summary fields
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    details.push({
                        label,
                        value: typeof value === 'object' ? JSON.stringify(value) : (value || 'N/A')
                    });
                }
            }
        });

        return { summaryData: details, nestedArrayKeys: arrayKeys };
    }, [currentDocumentData]);

    // Generate inner tabs dynamically based on data
    const innerTabs = useMemo(() => {
        const tabs = [
            { key: 'summary', label: <span title="Summary">Summary</span> }
        ];

        nestedArrayKeys.forEach(item => {
            tabs.push({
                key: item.key,
                label: (
                    <span title={item.label}>
                        {item.label}
                    </span>
                )
            });
        });

        return tabs;
    }, [nestedArrayKeys]);


    // Get data for active nested array tab
    const activeNestedData = useMemo(() => {
        if (activeInnerTab === 'summary') return null;

        const arrayItem = nestedArrayKeys.find(item => item.key === activeInnerTab);
        return arrayItem ? arrayItem.data : null;
    }, [activeInnerTab, nestedArrayKeys]);

    const nestedColumns = useMemo(() => {
        if (!activeNestedData || activeNestedData.length === 0) return [];

        return Object.keys(activeNestedData[0]).map((key) => ({
            headerName: key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            field: key,
            width: 200, // ← Set minimum width instead of flex
            valueGetter: (p) => {
                const v = p.data?.[key];
                return typeof v === "object" ? JSON.stringify(v) : v ?? "N/A";
            },
        }));
    }, [activeNestedData]);

    // Add this right before the return statement in LoanDocumentScreen
    const nestedDataWithIds = useMemo(() => {
        if (!activeNestedData) return [];
        return activeNestedData.map((item, index) => ({
            ...item,
            id: `${activeInnerTab}-${index}` // Add unique ID
        }));
    }, [activeNestedData, activeInnerTab]);


    const toggleBorrower = (id) => {
        setExpandedBorrowers(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const toggleItemSelection = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedItems([]);
    };

    const handleDocumentClick = (doc) => {
        setSelectedDocument(doc);
        setActiveInnerTab('summary');
        if (doc.data && doc.data.length > 0) {
            const firstDocKey = `${doc.id}-0`;
            setActiveDocumentTab(firstDocKey);
        }
    };

    const selectionInfo = useMemo(() => {
        if (selectedItems.length === 0) {
            return { hasBorrower: false, hasDocument: false };
        }

        const borrowerIds = new Set(borrowers.map(b => b.id));

        return {
            hasBorrower: selectedItems.some(id => borrowerIds.has(id)),
            hasDocument: selectedItems.some(id => !borrowerIds.has(id)),
        };
    }, [selectedItems, borrowers]);

    // borrower id list (for merge)
    const selectedBorrowerIds = useMemo(
        () => selectedItems.filter(id =>
            borrowers.some(b => b.id === id)
        ),
        [selectedItems, borrowers]
    );

    // borrowers involved in selected document categories (for move)
    const selectedBorrowerNamesForMove = useMemo(() => {
        const names = [];
        borrowers.forEach(b => {
            b.documents.forEach(doc => {
                if (selectedItems.includes(doc.id)) {
                    names.push(b.name);
                }
            });
        });
        return new Set(names);
    }, [selectedItems, borrowers]);





    return (
        <>
            <div className="px-2 py-1 flex items-center justify-between bg-[#F7F7F7]">
                <div className="flex items-center gap-3">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="text-Colors-Text-Primary-primary hover:text-teal-700 font-medium"
                    >
                        Back
                    </Button>
                    <span className='border-l border-gray-300 h-6'></span>
                    <Breadcrumb
                        separator="›"
                        items={[
                            {
                                title: <HomeOutlined />,
                            },
                            {
                                title: 'Loan ID: LN-20250915-001',
                            },
                            {
                                title: 'Upload & Extract Files',
                            },
                            {
                                title: <span className="text-gray-800 font-medium">Analysis Results</span>,
                            },
                        ]}
                        className="text-sm"
                    />
                </div>
                <div className="flex gap-3">
                    <div>
                        <CustomButton
                            variant={"outline"}
                            type="button"
                            className={`!w-[150px]`}
                        >
                            <img
                                src={Icons.loanDocument.eye}
                                alt=""
                                className="w-4 h-4"
                            />
                            View Results
                        </CustomButton>
                    </div>
                    <div>
                        <CustomButton
                            variant={"primary"}
                            type="button"
                        >
                            <img
                                src={Icons.loanDocument.text_search}
                                alt=""
                                className="w-4 h-4"
                            />
                            Start Analysing
                        </CustomButton>
                    </div>
                </div>
            </div>

            <div className="h-screen flex flex-col">
                {/* Main Layout */}
                <Layout className="flex-1 gap-2 bg-[#F7F7F7]">
                    {/* Left Sidebar */}
                    <Sider
                        width={330}
                        className="bg-[#F7F7F7] border-r border-gray-200 mt-2 rounded-2xl border"
                        style={{ height: 'calc(90dvh - 60px)', overflow: 'hidden', background: "#F5F7FB" }}
                    >
                        <div className="h-full flex flex-col">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
                                    {isSelectionMode ? (
                                        <>
                                            <span className="text-sm font-medium text-Colors-Text-Primary-primary">
                                                {selectedItems.length} Selected
                                            </span>
                                            <div className="flex items-center gap-2">

                                                <Tooltip title="Move selected documents">
                                                    <button
                                                        disabled={!selectionInfo.hasDocument}
                                                        className={`p-1.5 rounded hover:bg-gray-100 ${!selectionInfo.hasDocument ? "opacity-40 cursor-not-allowed" : ""}`}
                                                        onClick={() => setActiveModal("move")}
                                                    >
                                                        <img src={Icons.loanDocument.move} alt="" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Merge selected borrowers">
                                                    <button
                                                        disabled={!selectionInfo.hasBorrower}
                                                        className={`p-1.5 rounded hover:bg-gray-100 ${!selectionInfo.hasBorrower ? "opacity-40 cursor-not-allowed" : ""}`}
                                                        onClick={() => setActiveModal("merge")}
                                                    >
                                                        <img src={Icons.loanDocument.merge} alt="" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Clear selection">
                                                    <button
                                                        onClick={() => {
                                                            exitSelectionMode();
                                                            setSelectionType(null);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                    >
                                                        <img src={Icons.loanDocument.x_close} alt="" />
                                                    </button>
                                                </Tooltip>

                                            </div>

                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-base font-medium text-gray-900 custom-font-jura">
                                                Loan Package
                                            </h2>
                                            <button
                                                onClick={() => setIsSelectionMode(true)}
                                                className="text-sm text-Colors-Text-Primary-primary hover:[#24A1DD] font-medium"
                                            >
                                                Select
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Borrowers List */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="">
                                    {borrowers.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No borrower data available
                                        </div>
                                    ) : (
                                        borrowers.map((borrower) => {
                                            const isExpanded = expandedBorrowers.includes(borrower.id);
                                            const hasDocuments = borrower.documents.length > 0;

                                            return (
                                                <div key={borrower.id} className="border-b border-gray-200 ">
                                                    {/* Borrower Row */}
                                                    <button
                                                        onClick={() => hasDocuments && toggleBorrower(borrower.id)}
                                                        className="w-full flex items-center justify-between p-3 bg-white   transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isSelectionMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItems.includes(borrower.id)}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectionType("borrower");
                                                                        toggleItemSelection(borrower.id);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-4 h-4 rounded border-gray-300 checkbox-primary"
                                                                />
                                                            )}
                                                            <User className="w-4 h-4 text-[#4D4D4D]" />
                                                            <span className="text-sm font-medium text-Colors-Text-Primary-primary">
                                                                {borrower.name}
                                                            </span>
                                                        </div>
                                                        {hasDocuments && (
                                                            isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            )
                                                        )}
                                                    </button>

                                                    {/* Documents */}
                                                    {isExpanded && hasDocuments && (
                                                        <div className="pb-2 space-y-1">
                                                            {borrower.documents.map((doc) => (
                                                                <div
                                                                    key={doc.id}
                                                                    onClick={() => handleDocumentClick(doc)}
                                                                    className={`pl-4 flex items-center justify-between p-2.5 hover:bg-[#E2EFF5] cursor-pointer group ${selectedDocument?.id === doc.id ? 'bg-[#E2EFF5]' : ''
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        {isSelectionMode && (
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedFiles.some(
                                                                                    f =>
                                                                                        f.borrower === borrower.name &&
                                                                                        f.category === doc.name
                                                                                )}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation();

                                                                                    if (e.target.checked) {
                                                                                        // ADD FILE SELECTION
                                                                                        setSelectedFiles(prev => [
                                                                                            ...prev,
                                                                                            {
                                                                                                borrower: borrower.name,
                                                                                                category: doc.name,
                                                                                                docs: doc.data,
                                                                                            },
                                                                                        ]);
                                                                                    } else {
                                                                                        // REMOVE FILE SELECTION
                                                                                        setSelectedFiles(prev =>
                                                                                            prev.filter(
                                                                                                f =>
                                                                                                    !(
                                                                                                        f.borrower === borrower.name &&
                                                                                                        f.category === doc.name
                                                                                                    )
                                                                                            )
                                                                                        );
                                                                                    }

                                                                                    // still keep your generic selection status
                                                                                    setSelectionType("document");
                                                                                    toggleItemSelection(doc.id);
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="w-4 h-4 rounded border-gray-300 checkbox-primary"
                                                                            />
                                                                        )}

                                                                        {doc.type === 'folder' ? (
                                                                            <Folder className="w-4 h-4 text-[#4D4D4D]" />
                                                                        ) : (
                                                                            <FileText className="w-4 h-4 text-[#4D4D4D]" />
                                                                        )}
                                                                        <span className="text-sm text-gray-700">{doc.name}</span>
                                                                        <span className="px-2 py-0.5 bg-[#E0E0E0] text-gray-600 text-xs rounded-2xl">
                                                                            {doc.count}
                                                                        </span>
                                                                    </div>
                                                                    {(
                                                                        <span className=" opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <img src={Icons.loanDocument.arrow_right} alt="" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Add Borrower Button */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <CustomButton
                                    variant={"outline"}
                                    type="button"
                                >
                                    <img
                                        src={Icons.loanDocument.user_plus}
                                        alt=""
                                        className="w-4 h-4"
                                    />
                                    Add Borrower
                                </CustomButton>
                            </div>
                        </div>
                    </Sider>

                    {/* Main Content Area */}
                    <Content className="bg-white rounded-lg mt-2 p-5" >
                        <div className="bg-white rounded-lg border border-gray-200 overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
                            {!selectedDocument ? (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    Select a document from the left panel to view details
                                </div>
                            ) : (
                                <>
                                    <div className="border-b border-gray-200 bg-gray-50 flex items-center justify-between sticky top-0 z-20">
                                        <Tabs
                                            activeKey={activeDocumentTab}
                                            onChange={setActiveDocumentTab}
                                            items={documentTabs}
                                            className="pay-stub-tabs"
                                        />
                                        <Button type="text" icon={<ExpandAltOutlined />} />
                                    </div>

                                    <div className="overflow-x-auto sticky top-[44.5px] px-5 z-10 bg-white">
                                        <div className="min-w-max">
                                            <Tabs
                                                activeKey={activeInnerTab}
                                                onChange={setActiveInnerTab}
                                                items={innerTabs}
                                                className="inner-tabs"
                                                style={{ marginBottom: 0 }}
                                                type="line"

                                            />
                                        </div>
                                    </div>

                                    <div className='p-3 mt-1' style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                        {activeInnerTab === 'summary' ? (
                                            // Summary Tab - Show only non-array fields
                                            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                                                <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                                    {summaryData.map((item, idx) => (
                                                        <div key={idx} className="flex text-sm">
                                                            <span className="text-gray-500 min-w-[220px]">{item.label}:</span>
                                                            <span className="text-gray-900 font-medium">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            // Nested Array Tabs - Show table for the selected array
                                            <div className="mt-2">
                                                {nestedDataWithIds && nestedDataWithIds.length > 0 ? (
                                                    <ReusableDataTable
                                                        title=""
                                                        columnDefs={nestedColumns}
                                                        data={nestedDataWithIds}
                                                        loading={false}
                                                        tableSearch={false}
                                                        showFilter={false}
                                                        tableHeader={false}
                                                        searchPlaceholder="Search..."
                                                    />
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        No data available
                                                    </div>
                                                )}
                                            </div>

                                        )}

                                        {/* Summary section at the bottom ONLY for non-nested tabs */}
                                        {/* hides automatically when nested table exists */}
                                        {activeInnerTab !== 'summary' &&
                                            (!activeNestedData || activeNestedData.length === 0) &&
                                            summaryData.length > 0 && (
                                                <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 mt-4">
                                                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                                        {summaryData.map((item, idx) => (
                                                            <div key={idx} className="flex text-sm">
                                                                <span className="text-gray-500 min-w-[220px]">{item.label}:</span>
                                                                <span className="text-gray-900 font-medium">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                </>
                            )}
                        </div>
                    </Content>
                </Layout>
            </div>

            <MergeModal
                open={activeModal === "merge"}
                onCancel={() => setActiveModal(null)}
                items={borrowers.filter(
                    b => !selectedBorrowerIds.includes(b.id)
                )}
                onMerge={(target) => {
                    console.log("merge into", target);
                    handleMerge(target);
                    setActiveModal(null);
                }}
            />

            <MoveModal
                open={activeModal === "move"}
                onCancel={() => setActiveModal(null)}
                items={borrowers.filter(
                    b => !selectedBorrowerNamesForMove.has(b.name)
                )}
                onMove={async (target) => {
                    await handleMove(target.name);   // ← REAL MOVE ACTION
                    setActiveModal(null);
                    setIsSelectionMode(false);
                    setSelectedItems([]);
                }}
            />

        </>
    );
}