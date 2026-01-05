import React from "react";
import { Modal } from "antd";
import { User, Folder } from "lucide-react";

export const MergeModal = ({ open, onCancel, items = [], onMerge }) => {
    return (
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
                        onClick={() => onMerge?.(item)}
                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                    >
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{item.name}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export const MoveModal = ({ open, onCancel, items = [], onMove }) => {
    return (
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
                        onClick={() => onMove?.(item)}
                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                    >
                        <Folder className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{item.name}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
