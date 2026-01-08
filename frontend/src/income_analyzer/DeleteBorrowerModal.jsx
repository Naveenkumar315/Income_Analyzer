import { Modal } from "antd";
import { Trash2 } from "lucide-react";
import CustomButton from "../components/CustomButton";

export default function DeleteBorrowerModal({
    open,
    borrowerName = "",
    onCancel,
    onConfirm
}) {
    return (
        <Modal
            open={open}
            footer={null}
            centered
            onCancel={onCancel}
            width={420}
            closable={false}
        >
            <div className="text-center space-y-3">

                <div className="flex justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>

                <h2 className="text-lg font-semibold">
                    Delete Borrower
                </h2>

                <p className="text-gray-600 text-sm">
                    Are you sure you want to delete the borrower
                </p>

                <p className="font-semibold text-base">
                    {borrowerName}
                </p>

                <div className="flex gap-3 pt-3">

                    <CustomButton
                        variant="outline"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        No
                    </CustomButton>

                    <CustomButton
                        variant="primary"
                        className="flex-1"
                        onClick={onConfirm}
                    >
                        Yes
                    </CustomButton>

                </div>
            </div>
        </Modal>
    );
}
