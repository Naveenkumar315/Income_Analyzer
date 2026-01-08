import { Modal } from "antd";
import { ArrowUp, Move } from "lucide-react";
import CustomButton from "../components/CustomButton";

export default function ConfirmActionModal({
    open,
    icon = null,
    title,
    message,
    onCancel,
    onConfirm,
    confirmText = "Yes",
    cancelText = "No"
}) {
    return (
        <Modal
            open={open}
            closable={false}
            footer={null}
            centered
            width={420}
            maskClosable={false}
        >
            <div className="text-center space-y-4">

                <div className="flex justify-center">
                    {icon}
                </div>

                <h2 className="text-lg font-semibold">{title}</h2>

                <p
                    className=" text-sm"
                    dangerouslySetInnerHTML={{ __html: message }}
                />

                <div className="flex gap-3 pt-3">
                    <CustomButton
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </CustomButton>

                    <CustomButton
                        variant="primary"
                        className="flex-1 rounded-full"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </CustomButton>
                </div>
            </div>
        </Modal>
    );
}
