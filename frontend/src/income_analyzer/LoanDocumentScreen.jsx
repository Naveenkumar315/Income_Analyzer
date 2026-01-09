import React, { useState, useMemo } from 'react';
import { Layout, Button, Tabs, Breadcrumb } from 'antd';
import {
    ExpandAltOutlined,
    ArrowLeftOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronUp, Folder, FileText, User, Edit, Trash2, Edit2 } from 'lucide-react';
import { Tooltip } from "antd";

const { Sider, Content } = Layout;

import CustomButton from '../components/CustomButton';
import { Icons } from '../utils/icons';
import ReusableDataTable from '../custom_components/ReusableDataTable';
import { MergeModal, MoveModal } from './SelectionModals';
import { useLoanActions } from './useLoanDataManagement';
import BorrowerModal from './BorrowerModal';
import DeleteBorrowerModal from './DeleteBorrowerModal';
import toast from "../utils/ToastService";
import RestoreOriginalConfirmModal from './RestoreOriginalConfirmModal';

export default function LoanDocumentScreen({ files, currentStep, setCurrentStep, onStartAnalysis, analyzedData, onViewResults }) {
    const [activeDocumentTab, setActiveDocumentTab] = useState(null);
    const [activeInnerTab, setActiveInnerTab] = useState('summary');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [expandedBorrowers, setExpandedBorrowers] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [hasModifications, setHasModifications] = useState(false);
    const [restoreModal, setRestoreModal] = useState(false);
    const [activeTab, setActiveTab] = useState("modified");
    const [originalData, setOriginalData] = useState(null);
    const [borrowerModal, setBorrowerModal] = useState({
        open: false,
        mode: "add",
        borrowerId: null,
        name: ""
    });
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        name: ""
    });

    // State to manage modified data
    const [modifiedData, setModifiedData] = useState(() => files?.cleaned_data || {});

    const { handleMove, handleMerge, handleAddBorrower, handleDeleteBorrower, handleRenameBorrower, handleViewOriginal, handleRestoreOriginal, isProcessing } = useLoanActions();

    // Determine which data to display based on activeTab
    const displayData = useMemo(() => {
        return activeTab === "original" ? originalData : modifiedData;
    }, [activeTab, originalData, modifiedData]);

    // Process the cleaned data into structured format
    const processedData = useMemo(() => {
        if (!displayData) return { borrowers: [], allDocuments: {} };

        const borrowersMap = {};
        const allDocumentsMap = {};

        Object.entries(displayData).forEach(([borrowerKey, borrowerData]) => {
            const borrowerName = borrowerKey;
            const borrowerId = borrowerKey.replace(/\s+/g, '-').toLowerCase();

            if (!borrowersMap[borrowerId]) {
                borrowersMap[borrowerId] = {
                    id: borrowerId,
                    name: borrowerName,
                    documents: []
                };
            }

            Object.entries(borrowerData).forEach(([categoryKey, categoryData]) => {
                const categoryName = categoryKey;

                if (Array.isArray(categoryData) && categoryData.length > 0) {
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
    }, [displayData]);

    const { borrowers, allDocuments } = processedData;

    // Set initial states
    React.useEffect(() => {
        if (borrowers.length > 0 && !expandedBorrowers.length) {
            setExpandedBorrowers([borrowers[0].id]);
        }

        const docKeys = Object.keys(allDocuments);
        if (docKeys.length > 0 && !activeDocumentTab) {
            setActiveDocumentTab(docKeys[0]);
        }
    }, [borrowers, allDocuments]);

    // Document tabs
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

    // Current document data
    const currentDocumentData = useMemo(() => {
        if (!activeDocumentTab || !allDocuments[activeDocumentTab]) return null;
        return allDocuments[activeDocumentTab];
    }, [activeDocumentTab, allDocuments]);

    const isArrayData = (value) => {
        return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object';
    };

    // Summary and nested data
    const { summaryData, nestedArrayKeys } = useMemo(() => {
        if (!currentDocumentData) return { summaryData: [], nestedArrayKeys: [] };

        const details = [];
        const arrayKeys = [];

        Object.entries(currentDocumentData).forEach(([key, value]) => {
            if (key !== 'borrowerId' && key !== 'categoryKey' &&
                key !== 'index' && key !== 'label' && key !== 'recordId' &&
                key !== 'borrowerName' && key !== 'categoryName') {

                if (isArrayData(value)) {
                    arrayKeys.push({
                        key: key,
                        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        data: value
                    });
                } else {
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

    const innerTabs = useMemo(() => {
        const tabs = [
            { key: 'summary', label: <span title="Summary">Summary</span> }
        ];

        nestedArrayKeys.forEach(item => {
            tabs.push({
                key: item.key,
                label: <span title={item.label}>{item.label}</span>
            });
        });

        return tabs;
    }, [nestedArrayKeys]);

    const activeNestedData = useMemo(() => {
        if (activeInnerTab === 'summary') return null;
        const arrayItem = nestedArrayKeys.find(item => item.key === activeInnerTab);
        return arrayItem ? arrayItem.data : null;
    }, [activeInnerTab, nestedArrayKeys]);

    const nestedColumns = useMemo(() => {
        if (!activeNestedData || activeNestedData.length === 0) return [];

        return Object.keys(activeNestedData[0]).map((key) => ({
            headerName: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            field: key,
            width: 200,
            valueGetter: (p) => {
                const v = p.data?.[key];
                return typeof v === "object" ? JSON.stringify(v) : v ?? "N/A";
            },
        }));
    }, [activeNestedData]);

    const nestedDataWithIds = useMemo(() => {
        if (!activeNestedData) return [];
        return activeNestedData.map((item, index) => ({
            ...item,
            id: `${activeInnerTab}-${index}`
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

    const selectedBorrowerIds = useMemo(
        () => selectedItems.filter(id =>
            borrowers.some(b => b.id === id)
        ),
        [selectedItems, borrowers]
    );

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

    // Handle move operation
    const onMoveConfirm = async (targetBorrower) => {
        const result = await handleMove(
            targetBorrower.name,
            modifiedData,
            selectedItems,
            borrowers
        );

        if (result.success) {
            setModifiedData(result.updatedData);
            setHasModifications(true);
            toast.success("Documents moved successfully");
            setActiveModal(null);
            setIsSelectionMode(false);
            setSelectedItems([]);

            if (selectedDocument && selectedItems.includes(selectedDocument.id)) {
                setSelectedDocument(null);
                setActiveDocumentTab(null);
            }
        }
    };

    const onMergeConfirm = async (targetBorrower) => {
        const result = await handleMerge(
            targetBorrower.name,
            modifiedData,
            selectedItems,
            borrowers
        );

        if (result.success) {
            setModifiedData(result.updatedData);
            setHasModifications(true);
            toast.success("Borrowers merged successfully");
            setActiveModal(null);
            setIsSelectionMode(false);
            setSelectedItems([]);
        }
    };

    const handleBorrowerSubmit = async (name) => {
        if (borrowerModal.mode === "add") {
            const result = await handleAddBorrower(name.trim(), modifiedData);

            if (result.success) {
                setModifiedData(result.updatedData);
                setHasModifications(true);
                toast.success("Borrower added successfully");
            }
        }

        if (borrowerModal.mode === "edit") {
            const result = await handleRenameBorrower(
                borrowerModal.name,
                name.trim(),
                modifiedData
            );

            if (result.success) {
                setModifiedData(result.updatedData);
                setHasModifications(true);
                toast.success("Borrower renamed successfully");
            }
        }

        setBorrowerModal({ open: false, mode: "", borrowerId: null, name: "" });
    };

    const handleBackToOriginal = async () => {
        debugger
        const result = await handleViewOriginal();

        if (result.success) {
            setOriginalData(result.data);
            setActiveTab("original");
            setSelectedDocument(null);
            setActiveDocumentTab(null);
            toast.success("Viewing original data");
        }
    };

    const handleBackToModified = () => {
        setActiveTab("modified");
        setSelectedDocument(null);
        setActiveDocumentTab(null);
        toast.info("Back to modified data");
    };

    const onRestoreOriginalConfirm = async () => {
        debugger
        const result = await handleRestoreOriginal();

        if (result.success) {
            setModifiedData(result.data);
            setActiveTab("modified");
            setHasModifications(false);

            toast.success("Restored to original data");
        }

        setRestoreModal(false);
    };


    const handleStartAnalysing = () => {
        if (onStartAnalysis) {
            onStartAnalysis();
        }
    }


    return (
        <>
            <div className="px-2 py-1 flex items-center justify-between bg-[#F7F7F7]">
                <div className="flex items-center gap-3">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="text-Colors-Text-Primary-primary hover:text-teal-700 font-medium"
                        onClick={() => {
                            setCurrentStep(1)
                        }}
                    >
                        Back
                    </Button>
                    <span className='border-l border-gray-300 h-6'></span>
                    <Breadcrumb
                        separator="›"
                        className="text-sm"
                        items={[
                            {
                                title: <HomeOutlined />,
                            },
                            {
                                title: 'Loan ID',
                            },
                            {
                                title: 'Upload & Extract Files',
                                className: ` ${currentStep === 4 ? 'text-gray-800 font-medium' : ''}`
                            },
                            {
                                title: 'Analysis Results',
                            }
                        ]}
                    />
                </div>
                <div className="flex gap-3 w-[300px]">
                    <CustomButton
                        variant="outline"
                        type="button"
                        disabled={!analyzedData}
                        className={`${!analyzedData
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                            }`}
                        onClick={async () => {
                            const success = await onViewResults();

                            if (success) {
                                //  Then navigate to results page
                                setCurrentStep(5);
                            }
                        }}
                    >
                        <img src={Icons.loanDocument.eye} alt="" className="w-4 h-4" />
                        View Results
                    </CustomButton>

                    <CustomButton onClick={handleStartAnalysing} variant={"primary"} type="button">
                        <img src={Icons.loanDocument.text_search} alt="" className="w-4 h-4" />
                        Start Analysing
                    </CustomButton>
                </div>
            </div>

            <div className="h-screen flex flex-col">
                <Layout className="flex-1 gap-2 bg-[#F7F7F7]">
                    <Sider
                        width={330}
                        className="bg-[#F7F7F7] border-r border-gray-200 mt-2 rounded-2xl border"
                        style={{ height: 'calc(90dvh - 60px)', overflow: 'hidden', background: "#F5F7FB" }}
                    >
                        <div className="h-full flex flex-col">
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
                                                        disabled={!selectionInfo.hasDocument || isProcessing}
                                                        className={`p-1.5 rounded hover:bg-gray-100 ${!selectionInfo.hasDocument || isProcessing ? "opacity-40 cursor-not-allowed" : ""}`}
                                                        onClick={() => setActiveModal("move")}
                                                    >
                                                        <img src={(!selectionInfo.hasDocument || isProcessing) ? Icons.loanDocument.move : Icons.loanDocument.move_active_income} alt="" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Merge selected borrowers">
                                                    <button
                                                        disabled={!selectionInfo.hasBorrower || isProcessing}
                                                        className={`p-1.5 rounded hover:bg-gray-100 ${!selectionInfo.hasBorrower || isProcessing ? "opacity-40 cursor-not-allowed" : ""}`}
                                                        onClick={() => setActiveModal("merge")}
                                                    >
                                                        <img src={Icons.loanDocument.merge} alt="" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Clear selection">
                                                    <button
                                                        onClick={exitSelectionMode}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                        disabled={isProcessing}
                                                    >
                                                        <img src={Icons.loanDocument.x_close} alt="" />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-base font-medium text-gray-900 custom-font-jura">
                                                {activeTab === "original" ? "Original Package" : "Loan Package"}
                                            </h2>
                                            <div className='flex gap-3 items-center'>
                                                {activeTab === "modified" && hasModifications && (
                                                    <Tooltip title="View original data">
                                                        <img
                                                            onClick={handleBackToOriginal}
                                                            src={Icons.loanDocument.database_backup}
                                                            alt="View original"
                                                            className='cursor-pointer w-5 h-5'
                                                        />
                                                    </Tooltip>
                                                )}
                                                {activeTab === "original" && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Back to Modified */}
                                                        <Tooltip title="Restore original data">
                                                            <img
                                                                src={Icons.loanDocument.database_backup_active}
                                                                onClick={() => {
                                                                    setRestoreModal(true)
                                                                }}
                                                                className="w-5 h-5 cursor-pointer hover:opacity-80"
                                                                alt="Back to Modified"
                                                            />
                                                        </Tooltip>

                                                        {/* Close Original View */}
                                                        <Tooltip title="Close">
                                                            <img
                                                                src={Icons.loanDocument.x_close}
                                                                onClick={handleBackToModified}
                                                                className="w-4 h-4 cursor-pointer hover:opacity-80"
                                                                alt="Close"
                                                            />
                                                        </Tooltip>
                                                    </div>

                                                )}
                                                {activeTab === "modified" && (
                                                    <button
                                                        onClick={() => setIsSelectionMode(true)}
                                                        className="text-sm text-Colors-Text-Primary-primary hover:text-[#24A1DD] font-medium cursor-pointer"
                                                    >
                                                        Select
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {borrowers.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No borrower data available
                                    </div>
                                ) : (
                                    borrowers.map((borrower) => {
                                        const isExpanded = expandedBorrowers.includes(borrower.id);
                                        const hasDocuments = borrower.documents.length > 0;
                                        const isReadOnly = activeTab === "original";

                                        return (
                                            <div key={borrower.id} className="border-b border-gray-200">
                                                <div className="w-full flex items-center justify-between p-3 bg-white transition-colors group">
                                                    <div
                                                        onClick={() => hasDocuments && toggleBorrower(borrower.id)}
                                                        className="flex items-center gap-3 flex-1 cursor-pointer min-h-[32px]"
                                                    >

                                                        {isSelectionMode && !isReadOnly && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedItems.includes(borrower.id)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleItemSelection(borrower.id);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-4 h-4 rounded border-gray-300 checkbox-primary"
                                                            />
                                                        )}
                                                        <User className="w-4 h-4 text-[#4D4D4D]" />
                                                        <Tooltip title={borrower.name} placement="top">
                                                            <span
                                                                className="
                                                                text-sm font-medium text-Colors-Text-Primary-primary
                                                                max-w-[180px]
                                                                truncate
                                                                block
                                                            "
                                                            >
                                                                {borrower.name}
                                                            </span>
                                                        </Tooltip>

                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!isReadOnly && (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setBorrowerModal({
                                                                            open: true,
                                                                            mode: "edit",
                                                                            borrowerId: borrower.id,
                                                                            name: borrower.name
                                                                        });
                                                                    }}
                                                                    className="p-1 hover:bg-gray-100 rounded"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteModal({
                                                                            open: true,
                                                                            name: borrower.name
                                                                        });
                                                                    }}
                                                                    className="p-1 hover:bg-gray-100 rounded"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {hasDocuments && (
                                                            isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && hasDocuments && (
                                                    <div className="pb-2 space-y-1">
                                                        {borrower.documents.map((doc) => (
                                                            <div
                                                                key={doc.id}
                                                                onClick={() => handleDocumentClick(doc)}
                                                                className={`pl-4 flex items-center justify-between p-2.5 hover:bg-[#E2EFF5] cursor-pointer group ${selectedDocument?.id === doc.id ? 'bg-[#E2EFF5]' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    {isSelectionMode && !isReadOnly && (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedItems.includes(doc.id)}
                                                                            onChange={(e) => {
                                                                                e.stopPropagation();
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
                                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <img src={Icons.loanDocument.arrow_right} alt="" />
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {activeTab === "modified" && (
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <CustomButton
                                        variant="outline"
                                        type="button"
                                        onClick={() =>
                                            setBorrowerModal({
                                                open: true,
                                                mode: "add",
                                                borrowerId: null,
                                                name: ""
                                            })
                                        }
                                    >
                                        <img src={Icons.loanDocument.user_plus} className="w-4 h-4" />
                                        Add Borrower
                                    </CustomButton>
                                </div>
                            )}
                        </div>
                    </Sider>

                    <Content className="bg-white rounded-lg mt-2 p-5">
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
                items={borrowers.filter(b => !selectedBorrowerIds.includes(b.id))}
                fromName={selectedBorrowerIds}
                onMerge={onMergeConfirm}
            />

            <MoveModal
                open={activeModal === "move"}
                onCancel={() => setActiveModal(null)}
                items={borrowers.filter(b => !selectedBorrowerNamesForMove.has(b.name))}
                onMove={onMoveConfirm}
                loading={isProcessing}
            />

            <BorrowerModal
                open={borrowerModal.open}
                mode={borrowerModal.mode}
                initialName={borrowerModal.name}
                onCancel={() => setBorrowerModal({ ...borrowerModal, open: false })}
                onSubmit={handleBorrowerSubmit}
            />

            <DeleteBorrowerModal
                open={deleteModal.open}
                borrowerName={deleteModal.name}
                onCancel={() => setDeleteModal({ open: false, name: "" })}
                onConfirm={async () => {
                    const result = await handleDeleteBorrower(
                        deleteModal.name,
                        modifiedData
                    );

                    if (result.success) {
                        setModifiedData(result.updatedData);
                        setHasModifications(true);
                    }

                    setDeleteModal({ open: false, name: "" });
                }}
            />

            <RestoreOriginalConfirmModal
                open={restoreModal}
                loading={isProcessing}
                onCancel={() => setRestoreModal(false)}
                onConfirm={onRestoreOriginalConfirm}
            />

        </>
    );
}