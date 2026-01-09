import React from 'react';
import { Modal } from "antd";
import RulesList from "../rules/RulesList";

const UnderWritingRulesModal = ({ isOpen, onClose }) => {
    return (
        <Modal
            title={<span className="text-2xl text-gray-900 custom-font-jura">Rules</span>}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={1400}
            centered
        >
            <div className="max-h-[80vh] overflow-y-auto pr-2">
                <RulesList />
            </div>
        </Modal>
    );
};

export default UnderWritingRulesModal;
