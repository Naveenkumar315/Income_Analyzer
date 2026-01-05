import { useState, useEffect, useCallback } from "react";
import { useUpload } from "../../context/UploadContext";
import loanApi from "../../api/loanApi";
import { toast } from "react-toastify";

export const useLoanDataManagement = () => {
    const {
        normalized_json,
        set_normalized_json,
        setBorrowerList,
        set_filter_borrower,
        hasModifications,
        setHasModifications,
    } = useUpload();

    const [originalData, setOriginalData] = useState({});
    const [modifiedData, setModifiedData] = useState({});
    const [activeTab, setActiveTab] = useState("modified");

    const [selectedBorrower, setSelectedBorrower] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [openBorrowers, setOpenBorrowers] = useState({});

    const [selectMode, setSelectMode] = useState(false);
    const [selectedBorrowers, setSelectedBorrowers] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [editingBorrower, setEditingBorrower] = useState(null);
    const [editingName, setEditingName] = useState("");

    // ---------------- INIT ON JSON CHANGE ----------------
    useEffect(() => {
        if (normalized_json) {
            const snapshot = JSON.parse(JSON.stringify(normalized_json));
            setOriginalData(snapshot);
            setModifiedData(snapshot);
        }
    }, [normalized_json]);

    const currentData = activeTab === "original" ? originalData : modifiedData;
    const borrowers = currentData ? Object.keys(currentData) : [];

    // ---------------- UPDATE CONTEXT LIST ----------------
    useEffect(() => {
        if (activeTab === "modified") {
            const list = Object.keys(modifiedData || {});
            setBorrowerList(list);

            if (!selectedBorrower && list.length > 0) {
                set_filter_borrower(list[0]);
            }
        }
    }, [activeTab, modifiedData, selectedBorrower, setBorrowerList, set_filter_borrower]);

    // ---------------- CORE PERSIST HELPER ----------------
    const persistAndSetModified = useCallback(async (updatedJson, actionTag, successMsg) => {
        try {
            const res = await loanApi.updateCleanedData({
                email: sessionStorage.getItem("email") || "",
                loanID: sessionStorage.getItem("loanId") || "",
                username: sessionStorage.getItem("username") || "",
                action: actionTag,
                raw_json: updatedJson,
                hasModifications: true,
            });

            const cleanedJson = res?.data?.cleaned_json || updatedJson;

            setModifiedData(cleanedJson);
            set_normalized_json(cleanedJson);
            setHasModifications(true);
            setActiveTab("modified");

            if (successMsg) toast.success(successMsg);

            return { success: true, data: cleanedJson };
        } catch (err) {
            console.error("Persist error:", err);
            toast.error(err?.response?.data?.message || "Operation failed. Please try again.");
            return { success: false, error: err };
        }
    }, [set_normalized_json, setHasModifications]);

    // ---------------- ADD BORROWER ----------------
    const handleAddBorrower = useCallback(async (name) => {
        if (!name?.trim()) {
            toast.warn("Borrower name cannot be empty");
            return { success: false };
        }

        const trimmedName = name.trim();
        const list = Object.keys(modifiedData || {});

        if (list.some(b => b.toLowerCase() === trimmedName.toLowerCase())) {
            toast.warn(`Borrower "${trimmedName}" already exists.`);
            return { success: false };
        }

        const updated = { ...modifiedData, [trimmedName]: {} };

        const result = await persistAndSetModified(
            updated,
            "add_borrower",
            `Borrower "${trimmedName}" added successfully`
        );

        return result;
    }, [modifiedData, persistAndSetModified]);

    // ---------------- DELETE BORROWER ----------------
    const handleDeleteBorrower = useCallback(async (name) => {
        if (!name) {
            toast.warn("No borrower selected to delete");
            return { success: false };
        }

        const updated = { ...modifiedData };
        delete updated[name];

        const result = await persistAndSetModified(
            updated,
            "delete_borrower",
            `Borrower "${name}" deleted successfully`
        );

        if (result.success && selectedBorrower === name) {
            setSelectedBorrower(null);
            setSelectedCategory(null);
        }

        return result;
    }, [modifiedData, selectedBorrower, persistAndSetModified]);

    // ---------------- RENAME BORROWER ----------------
    const handleRenameBorrower = useCallback(async (oldName, newName) => {
        if (!newName?.trim() || newName === oldName) {
            setEditingBorrower(null);
            return { success: false };
        }

        const trimmedNewName = newName.trim();
        const list = Object.keys(modifiedData || {});

        if (list.some(b => b.toLowerCase() === trimmedNewName.toLowerCase() && b !== oldName)) {
            toast.warn(`Borrower "${trimmedNewName}" already exists.`);
            return { success: false };
        }

        const updated = { ...modifiedData };
        updated[trimmedNewName] = updated[oldName];
        delete updated[oldName];

        const result = await persistAndSetModified(
            updated,
            "rename_borrower",
            `Renamed "${oldName}" to "${trimmedNewName}" successfully`
        );

        if (result.success) {
            if (selectedBorrower === oldName) {
                setSelectedBorrower(trimmedNewName);
            }
            setEditingBorrower(null);
        }

        return result;
    }, [modifiedData, persistAndSetModified, selectedBorrower]);

    // ---------------- MERGE BORROWERS ----------------
    const handleMerge = useCallback(async (targetBorrower, sourceBorrowers = null) => {
        if (!targetBorrower) {
            toast.warn("Please select a target borrower");
            return { success: false };
        }

        const toMerge = sourceBorrowers || selectedBorrowers.filter(b => b !== targetBorrower);

        if (toMerge.length === 0) {
            toast.warn("No borrowers selected to merge");
            return { success: false };
        }

        const cloned = JSON.parse(JSON.stringify(modifiedData));
        let target = cloned[targetBorrower] || {};

        toMerge.forEach(src => {
            const cats = cloned[src] || {};
            Object.keys(cats).forEach(cat => {
                if (!Array.isArray(target[cat])) target[cat] = [];
                target[cat].push(...cats[cat]);
            });
            delete cloned[src];
        });

        cloned[targetBorrower] = target;

        const result = await persistAndSetModified(
            cloned,
            "folder_merge",
            `Successfully merged ${toMerge.length} borrower(s) into "${targetBorrower}"`
        );

        if (result.success) {
            setSelectMode(false);
            setSelectedBorrowers([]);
        }

        return result;
    }, [modifiedData, selectedBorrowers, persistAndSetModified]);

    // ---------------- MOVE DOCUMENTS ----------------
    const handleMove = useCallback(async (toBorrower, filesToMove = null) => {
        if (!toBorrower) {
            toast.warn("Please select a target borrower");
            return { success: false };
        }

        const files = filesToMove || selectedFiles;

        if (files.length === 0) {
            toast.warn("No documents selected to move");
            return { success: false };
        }

        const cloned = JSON.parse(JSON.stringify(modifiedData));

        files.forEach(({ borrower, category, docs }) => {
            // Create target borrower if doesn't exist
            if (!cloned[toBorrower]) cloned[toBorrower] = {};
            if (!cloned[toBorrower][category]) cloned[toBorrower][category] = [];

            // Add documents to target
            cloned[toBorrower][category].push(...docs);

            // Remove from source
            if (cloned[borrower]?.[category]) {
                delete cloned[borrower][category];

                // Remove borrower if empty
                if (Object.keys(cloned[borrower]).length === 0) {
                    delete cloned[borrower];
                }
            }
        });

        const result = await persistAndSetModified(
            cloned,
            "file_merge",
            `Successfully moved ${files.length} document set(s) to "${toBorrower}"`
        );

        if (result.success) {
            setSelectMode(false);
            setSelectedFiles([]);
        }

        return result;
    }, [modifiedData, selectedFiles, persistAndSetModified]);

    // ---------------- VIEW ORIGINAL ----------------
    const handleViewOriginal = useCallback(async () => {
        try {
            const res = await loanApi.getOriginalData({
                email: sessionStorage.getItem("email") || "",
                loanId: sessionStorage.getItem("loanId") || "",
            });

            setOriginalData(res?.data?.cleaned_data || {});
            setActiveTab("original");
            setSelectedBorrower(null);
            setSelectedCategory(null);

            toast.success("Original data loaded");
            return { success: true };
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch original data");
            return { success: false, error: err };
        }
    }, []);

    // ---------------- EXIT ORIGINAL VIEW ----------------
    const handleExitOriginalView = useCallback(() => {
        setActiveTab("modified");
        setSelectedBorrower(null);
        setSelectedCategory(null);
    }, []);

    // ---------------- UI HELPERS ----------------
    const toggleBorrower = useCallback(
        name => setOpenBorrowers(prev => ({ ...prev, [name]: !prev[name] })),
        []
    );

    const isCategorySelected = useCallback(
        (borrower, category) =>
            selectedFiles.some(f => f.borrower === borrower && f.category === category),
        [selectedFiles]
    );

    const handleCategoryClick = useCallback((borrower, category) => {
        setSelectedBorrower(borrower);
        setSelectedCategory(category);
    }, []);

    return {
        // Data
        currentData,
        modifiedData,
        originalData,
        borrowers,
        activeTab,
        hasModifications,

        // Selection state
        openBorrowers,
        selectedBorrower,
        selectedCategory,
        selectMode,
        selectedBorrowers,
        selectedFiles,

        // Editing state
        editingBorrower,
        editingName,

        // Setters
        setSelectMode,
        setSelectedBorrowers,
        setSelectedFiles,
        setEditingBorrower,
        setEditingName,
        setModifiedData,
        setSelectedBorrower,
        setSelectedCategory,

        // Actions
        toggleBorrower,
        handleAddBorrower,
        handleDeleteBorrower,
        handleRenameBorrower,
        handleMerge,
        handleMove,
        handleViewOriginal,
        handleExitOriginalView,
        isCategorySelected,
        handleCategoryClick,
    };
};