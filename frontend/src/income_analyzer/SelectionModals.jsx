import React, { useState } from "react";
import { Modal } from "antd";
import { User, Folder, Move, ArrowUp } from "lucide-react";
import ConfirmActionModal from "./ConfirmActionModal";
import { Icons } from "../utils/icons";

export const MergeModal = ({ open, onCancel, items = [], onMerge, fromName }) => {
    const [confirmItem, setConfirmItem] = useState(null);

    return (
        <>
            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                centered
                width={360}
                title="Merge Selected With"
            >
                <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                    {items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setConfirmItem(item)}
                            className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                        >
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-sm">{item.name}</span>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Merge Confirmation UI */}
            {confirmItem && (
                <ConfirmActionModal
                    open
                    icon={<img
                        src={Icons.loanDocument.merge}
                        alt="merge"
                        className="w-6 h-6 mx-auto"
                    />}
                    title="Merge Borrowers"
                    message={`Are you sure you want to merge <br/> <b>${fromName}</b> with <b>${confirmItem.name}</b>?`}
                    confirmText="Yes"
                    cancelText="No"
                    onCancel={() => setConfirmItem(null)}
                    onConfirm={() => {
                        onMerge?.(confirmItem);
                        setConfirmItem(null);
                    }}
                />
            )}
        </>
    );
};

export const MoveModal = ({ open, onCancel, items = [], onMove }) => {
    const [confirmItem, setConfirmItem] = useState(null);

    return (
        <>
            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                centered
                width={360}
                title="Move Selected To"
            >
                <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                    {items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setConfirmItem(item)}
                            className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                        >
                            <Folder className="w-4 h-4 text-gray-600" />
                            <span className="text-sm">{item.name}</span>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Move Confirmation UI */}
            {confirmItem && (
                <ConfirmActionModal
                    open
                    icon={<img
                        src={Icons.loanDocument.move_active}
                        alt="move"
                        className="w-6 h-6 mx-auto text-Colors-Text-Primary-primary"
                    />}
                    title="Move Files"
                    message={`Are you sure you want to move the selected  <br/> files to <b>${confirmItem.name}</b>?`}
                    confirmText="Yes"
                    cancelText="No"
                    onCancel={() => setConfirmItem(null)}
                    onConfirm={() => {
                        onMove?.(confirmItem);
                        setConfirmItem(null);
                    }}
                />
            )}
        </>
    );
};
