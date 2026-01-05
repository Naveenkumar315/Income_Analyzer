import axiosClient from "./axiosClient";

const loanApi = {
    /**
     * Universal endpoint for all data modification actions
     * This is the primary method used by the hook
     */
    updateCleanedData: (payload) =>
        axiosClient.post("/update-cleaned-data", payload),

    /**
     * Fetch original unmodified JSON
     */
    getOriginalData: (payload) =>
        axiosClient.post("/get-original-data", payload),

    // ========== BORROWER OPERATIONS ==========

    /**
     * Add a new borrower
     * @param {Object} params
     * @param {Object} params.raw_json - The complete modified JSON
     * @param {string} params.borrowerName - Name of borrower to add
     */
    addBorrower: ({ raw_json, borrowerName }) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            action: "add_borrower",
            borrowerName,
            raw_json,
            hasModifications: true,
        }),

    /**
     * Rename an existing borrower
     * @param {Object} params
     * @param {Object} params.raw_json - The complete modified JSON
     * @param {string} params.oldName - Current borrower name
     * @param {string} params.newName - New borrower name
     */
    renameBorrower: ({ raw_json, oldName, newName }) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            action: "rename_borrower",
            oldName,
            newName,
            raw_json,
            hasModifications: true,
        }),

    /**
     * Delete a borrower and all their documents
     * @param {Object} params
     * @param {Object} params.raw_json - The complete modified JSON
     * @param {string} params.borrowerName - Name of borrower to delete
     */
    deleteBorrower: ({ raw_json, borrowerName }) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            action: "delete_borrower",
            borrowerName,
            raw_json,
            hasModifications: true,
        }),

    // ========== MERGE OPERATIONS ==========

    /**
     * Merge multiple borrowers into one target borrower
     * @param {Object} params
     * @param {Object} params.raw_json - The complete modified JSON
     * @param {string[]} params.sourceBorrowers - Array of borrower names to merge from
     * @param {string} params.targetBorrower - Target borrower name to merge into
     */
    mergeBorrowers: ({ raw_json, sourceBorrowers, targetBorrower }) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            action: "folder_merge",
            sourceBorrowers,
            targetBorrower,
            raw_json,
            hasModifications: true,
        }),

    // ========== DOCUMENT MOVE OPERATIONS ==========

    /**
     * Move document categories from one borrower to another
     * @param {Object} params
     * @param {Object} params.raw_json - The complete modified JSON
     * @param {string} params.toBorrower - Target borrower name
     * @param {Array} params.selectedFiles - Array of file objects to move
     * @param {string} params.selectedFiles[].borrower - Source borrower name
     * @param {string} params.selectedFiles[].category - Document category name
     * @param {Array} params.selectedFiles[].docs - Array of document objects
     */
    moveDocuments: ({ raw_json, toBorrower, selectedFiles }) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            action: "file_merge",
            toBorrower,
            selectedFiles,
            raw_json,
            hasModifications: true,
        }),

    // ========== HELPER METHODS (if needed for specific use cases) ==========

    /**
     * Generic update method for custom actions
     * @param {Object} params - Custom parameters
     */
    customUpdate: (params) =>
        axiosClient.post("/update-cleaned-data", {
            email: sessionStorage.getItem("email") || "",
            loanID: sessionStorage.getItem("loanId") || "",
            username: sessionStorage.getItem("username") || "",
            hasModifications: true,
            ...params,
        }),
};

export default loanApi;