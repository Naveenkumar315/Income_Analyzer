import { Modal } from "antd";
import CustomButton from "../components/CustomButton";
import { Icons } from "../utils/icons";

export default function RestoreOriginalConfirmModal({
    open,
    onCancel,
    onConfirm,
    loading = false
}) {
    return (
        <Modal
            open={open}
            centered
            footer={null}
            closable={false}
            width={420}
        >
            <div className="text-center space-y-2">

                <img
                    src={Icons.loanDocument.rotate_cw}
                    alt=""
                    className="w-10 h-10 mx-auto"
                />

                <h2 className="text-lg font-semibold">
                    Restore Original Data?
                </h2>

                <p className="text-gray-600 text-sm">
                    Are you sure you want to restore the original data?

                    <br />
                    <b>All recent changes will be lost.
                    </b>
                </p>

                <div className="flex gap-3 pt-4">
                    <CustomButton
                        variant="outline"
                        type="button"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        No
                    </CustomButton>

                    <CustomButton
                        variant="primary"
                        type="button"
                        className="flex-1"
                        loading={loading}
                        onClick={onConfirm}
                    >
                        Yes
                    </CustomButton>
                </div>
            </div>
        </Modal>
    );
}
