import React, { useEffect, useState } from "react";
import { Modal, Upload } from "antd";
import { Icons } from "../utils/icons";
import CustomButton from "../components/CustomButton";

const UploadDocumentsModal = ({ open, onCancel, onUpload }) => {
    const [fileList, setFileList] = useState([]);

    const handleRemove = (file) => {
        setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    };

    const handleBeforeUpload = (file) => {
        const normalizedFile = {
            uid: file.uid,
            name: file.name,
            type: file?.type?.split("/")?.[1] || file.name.split(".").pop(),
            size: file.size,
            status: "pending",
            raw: file,
        };

        setFileList((prev) => [...prev, normalizedFile]);

        return false; // stop antd auto upload
    };

    const formatFileSize = (bytes) => {
        if (!bytes && bytes !== 0) return "";
        const kb = bytes / 1024;
        const mb = kb / 1024;
        if (mb >= 1) return `${mb.toFixed(1)} MB`;
        return `${Math.round(kb)} KB`;
    };

    //  Upload button click
    const handleUploadClick = () => {
        if (!fileList.length) return;

        //  send REAL File Blob, not wrapper object
        const realFile = fileList[0]?.raw || fileList[0];

        onUpload?.(realFile);

        // update UI state to done (optional)
        setFileList((prev) =>
            prev.map((f) =>
                f.uid === fileList[0].uid
                    ? { ...f, status: "done" }
                    : f
            )
        );
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={() => {
                setFileList([]);
                onCancel();
            }}
            width={900}
            centered
            footer={null}
            maskClosable={false}
            styles={{
                content: { borderRadius: 15, overflow: "hidden" },
                body: { padding: 0 },
            }}
            wrapClassName="custom-upload-file-modal"
        >
            <div className="flex flex-col max-h-[80vh] -mx-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-8 py-4 mx-6">
                    <div className="custom-font-jura text-[#3D4551]">
                        Upload Documents to Start Extracting
                    </div>
                </div>

                {/* Body */}
                <div className="px-8 py-6 mx-6 overflow-y-auto">
                    {/* Drag & Drop */}
                    <Upload.Dragger
                        multiple={false}
                        fileList={[]}
                        beforeUpload={handleBeforeUpload}
                        showUploadList={false}
                        className="rounded-xl"
                        accept=".json"
                    >
                        <p className="flex justify-center">
                            <img src={Icons.upload.upload} alt="" />
                        </p>
                        <p>
                            <span className="text-[#22B4E6]">Upload a file</span> or drag and
                            drop
                        </p>
                        <p className="text-gray-400 text-sm">
                            Supported file type : json
                        </p>
                    </Upload.Dragger>

                    {/* File list */}
                    <div className="mt-4 space-y-3">
                        {fileList.map((file) => (
                            <div
                                key={file.uid}
                                className="flex justify-between items-center border border-[#E5E7EB] rounded px-2 py-2"
                            >
                                {/* LEFT */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#E8F6FF] flex items-center justify-center">
                                        <img src={Icons.upload.file} alt="file" className="w-4 h-4" />
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium text-[#3D4551]">
                                            {file.name}
                                        </div>

                                        <div className="text-xs text-[#8A8F9C]">
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <img
                                    onClick={() => handleRemove(file)}
                                    className="cursor-pointer"
                                    src={Icons.upload.trash2}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-2 border-[#E5E7EB] flex justify-end gap-3 mx-6">
                    <div className="w-[130px]">
                        <CustomButton
                            variant="outline"
                            onClick={() => {
                                setFileList([]);
                                onCancel();
                            }}
                        >
                            Discard
                        </CustomButton>
                    </div>

                    <div className="w-[130px]">
                        <CustomButton
                            variant="primary"
                            disabled={!fileList.length}
                            onClick={handleUploadClick}
                        >
                            Upload
                        </CustomButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UploadDocumentsModal;
