// useLoanDataManagement.js
import { useCallback, useState } from 'react';
import loanApi from '../api/loanApi';
import { toast } from 'react-toastify';

export const useLoanActions = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Handles moving document categories from selected borrowers to target borrower
     * @param {string} toBorrower - Target borrower name
     * @param {Object} currentData - Current modified JSON data
     * @param {Array} selectedItems - Array of selected document IDs
     * @param {Array} borrowers - Array of all borrowers with their documents
     * @returns {Object} { success: boolean, updatedData: Object }
     */
    const handleMove = useCallback(
        async (toBorrower, currentData, selectedItems, borrowers) => {
            if (!toBorrower || selectedItems.length === 0) {
                toast.error("Please select items to move");
                return { success: false, updatedData: null };
            }

            setIsProcessing(true);

            try {
                // Deep clone the current data to avoid mutations
                const movedData = JSON.parse(JSON.stringify(currentData));

                // Build selectedFiles array from selectedItems
                const selectedFiles = [];

                borrowers.forEach(borrower => {
                    borrower.documents.forEach(doc => {
                        if (selectedItems.includes(doc.id)) {
                            selectedFiles.push({
                                borrower: doc.borrowerName,
                                category: doc.categoryKey,
                                docs: doc.data
                            });
                        }
                    });
                });

                if (selectedFiles.length === 0) {
                    toast.error("No valid documents selected");
                    return { success: false, updatedData: null };
                }

                // Perform the move operation on the cloned data
                selectedFiles.forEach(({ borrower, category, docs }) => {
                    // Initialize target borrower if doesn't exist
                    if (!movedData[toBorrower]) {
                        movedData[toBorrower] = {};
                    }

                    // Initialize target category if doesn't exist
                    if (!movedData[toBorrower][category]) {
                        movedData[toBorrower][category] = [];
                    }

                    // Add docs to target borrower's category
                    movedData[toBorrower][category].push(...docs);

                    // Remove category from source borrower
                    if (movedData[borrower] && movedData[borrower][category]) {
                        delete movedData[borrower][category];

                        // If source borrower has no categories left, remove the borrower
                        if (Object.keys(movedData[borrower]).length === 0) {
                            movedData[borrower] = {}; // empty object
                        }
                    }
                });

                // Persist changes to backend
                const response = await loanApi.moveDocuments({
                    raw_json: movedData,
                    toBorrower: toBorrower,
                    selectedFiles: selectedFiles
                });

                const cleanedJson = response?.data?.cleaned_json || movedData;

                toast.success(
                    `Moved ${selectedFiles.length} category(ies) to ${toBorrower}`
                );

                return {
                    success: true,
                    updatedData: cleanedJson
                };

            } catch (error) {
                console.error("Move operation error:", error);
                toast.error(
                    error?.response?.data?.message ||
                    "Failed to move documents. Please try again."
                );
                return { success: false, updatedData: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    // inside useLoanActions.js
    const handleMerge = useCallback(
        async (targetBorrowerName, currentData, selectedItems, borrowers) => {
            debugger
            if (!targetBorrowerName) {
                toast.error("Select a target borrower");
                return { success: false, updatedData: null };
            }

            // Get borrower-level ids only
            const borrowerIds = new Set(borrowers.map(b => b.id));

            // Which borrowers were actually selected
            const selectedBorrowerNames = borrowers
                .filter(b => selectedItems.includes(b.id))
                .map(b => b.name)
                .filter(name => name !== targetBorrowerName);

            if (selectedBorrowerNames.length === 0) {
                toast.error("Select at least one borrower to merge");
                return { success: false, updatedData: null };
            }

            setIsProcessing(true);

            try {
                // deep clone
                const mergedData = JSON.parse(JSON.stringify(currentData));

                // ensure target exists
                if (!mergedData[targetBorrowerName]) {
                    mergedData[targetBorrowerName] = {};
                }

                // merge each selected borrower
                selectedBorrowerNames.forEach(sourceName => {
                    const sourceCategories = mergedData[sourceName] || {};

                    Object.entries(sourceCategories).forEach(([categoryName, docs]) => {
                        if (!Array.isArray(mergedData[targetBorrowerName][categoryName])) {
                            mergedData[targetBorrowerName][categoryName] = [];
                        }

                        mergedData[targetBorrowerName][categoryName].push(...docs);
                    });

                    // remove merged borrower
                    delete mergedData[sourceName];
                });

                //  API call (same style as handleMove)
                const response = await loanApi.mergeBorrowers({
                    raw_json: mergedData,
                    sourceBorrowers: selectedBorrowerNames,
                    targetBorrower: targetBorrowerName
                });

                const cleanedJson =
                    response?.data?.cleaned_json || mergedData;

                toast.success(
                    `Merged ${selectedBorrowerNames.length} borrower(s) into ${targetBorrowerName}`
                );

                return {
                    success: true,
                    updatedData: cleanedJson
                };
            } catch (err) {
                console.error("Merge operation error:", err);
                toast.error("Failed to merge borrowers. Please try again.");
                return { success: false, updatedData: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    const handleAddBorrower = useCallback(
        async (borrowerName, currentData) => {
            if (!borrowerName?.trim()) {
                toast.error("Borrower name cannot be empty");
                return { success: false, updatedData: null };
            }

            setIsProcessing(true);

            try {
                // clone JSON
                const updated = JSON.parse(JSON.stringify(currentData));

                // prevent duplicate name
                if (updated[borrowerName]) {
                    toast.error("Borrower name already exists");
                    return { success: false, updatedData: null };
                }

                // add borrower
                updated[borrowerName] = {};

                // API persist
                const response = await loanApi.addBorrower({
                    raw_json: updated,
                    borrowerName,
                });

                const cleanedJson = response?.data?.cleaned_json || updated;

                toast.success("Borrower added successfully");

                return {
                    success: true,
                    updatedData: cleanedJson,
                };
            } catch (err) {
                console.error("Add borrower error:", err);
                toast.error("Failed to add borrower");
                return { success: false, updatedData: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    const handleRenameBorrower = useCallback(
        async (oldName, newName, currentData) => {
            if (!newName?.trim()) {
                toast.error("Borrower name cannot be empty");
                return { success: false, updatedData: null };
            }

            if (oldName === newName.trim()) {
                toast.info("No changes made");
                return { success: true, updatedData: currentData };
            }

            setIsProcessing(true);

            try {
                // clone JSON
                const updated = JSON.parse(JSON.stringify(currentData));

                if (!updated[oldName]) {
                    toast.error("Borrower does not exist");
                    return { success: false, updatedData: null };
                }

                // prevent duplicate
                if (updated[newName]) {
                    toast.error("Borrower name already exists");
                    return { success: false, updatedData: null };
                }

                // rename key
                updated[newName] = updated[oldName];
                delete updated[oldName];

                // API persist
                const response = await loanApi.renameBorrower({
                    raw_json: updated,
                    oldName,
                    newName
                });

                const cleanedJson = response?.data?.cleaned_json || updated;

                toast.success("Borrower renamed successfully");

                return { success: true, updatedData: cleanedJson };
            } catch (err) {
                console.error("Rename borrower error:", err);
                toast.error("Failed to rename borrower");
                return { success: false, updatedData: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    const handleDeleteBorrower = useCallback(
        async (borrowerName, currentData) => {
            if (!borrowerName) return;

            setIsProcessing(true);

            try {
                const updated = JSON.parse(JSON.stringify(currentData));

                if (!updated[borrowerName]) {
                    toast.error("Borrower not found");
                    return { success: false, updatedData: null };
                }

                delete updated[borrowerName];

                const response = await loanApi.deleteBorrower({
                    raw_json: updated,
                    borrowerName
                });

                const cleanedJson = response?.data?.cleaned_json || updated;

                toast.success("Borrower deleted successfully");

                return { success: true, updatedData: cleanedJson };
            } catch (err) {
                console.error("Delete borrower error:", err);
                toast.error("Failed to delete borrower");
                return { success: false, updatedData: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    const handleViewOriginal = useCallback(
        async () => {
            try {
                debugger
                setIsProcessing(true);

                const res = await loanApi.getOriginalData({
                    email: sessionStorage.getItem("user_email") || "",
                    loanId: sessionStorage.getItem("loanId") || "",
                    // username: sessionStorage.getItem("user_name") || "",
                });

                const cleanedData = res?.cleaned_data || {};

                toast.success("Original loan package loaded");

                return {
                    success: true,
                    data: cleanedData
                };
            } catch (err) {
                console.error("Error fetching original data:", err);
                toast.error("Failed to load original data");
                return { success: false, data: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    const handleRestoreOriginal = useCallback(
        async () => {
            debugger
            try {
                setIsProcessing(true);

                const res = await loanApi.restoreOriginalData();

                toast.success("Original loan package restored");

                return {
                    success: true,
                    data: res?.cleaned_json || {},
                };
            } catch (err) {
                console.error("Error restoring original data:", err);
                toast.error("Failed to restore original data");
                return { success: false, data: null };
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );





    return {
        handleMove,
        handleMerge,
        handleAddBorrower,
        handleRenameBorrower,
        handleDeleteBorrower,
        handleViewOriginal,
        handleRestoreOriginal,
        isProcessing
    };
};