import { createContext, useContext, useState } from "react";

const UploadContext = createContext(null);

export const UploadProvider = ({ children }) => {

    // ---------- UPLOAD STATES ----------
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [toast, setToast] = useState({
        open: false,
        type: "",
        message: "",
    });

    // ---------- FILE HELPERS ----------
    const addFile = (file) => {
        setFiles(prev => [...prev, file]);
    };

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    // ---------- TOAST HELPERS ----------
    const showToast = (type, message) => {
        setToast({
            open: true,
            type,
            message,
        });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    // ---------- RESET EVERYTHING ----------
    const resetUploadState = () => {
        setFiles([]);
        setUploading(false);
        setProgress(0);
        setToast({
            open: false,
            type: "",
            message: "",
        });
    };

    return (
        <UploadContext.Provider
            value={{
                files,
                setFiles,
                addFile,
                removeFile,
                clearFiles,

                uploading,
                setUploading,

                progress,
                setProgress,

                toast,
                showToast,
                hideToast,

                resetUploadState,
            }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => useContext(UploadContext);
