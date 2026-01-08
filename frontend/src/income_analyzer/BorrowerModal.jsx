import { Modal, Input } from "antd";
import { UserPlus, UserPen } from "lucide-react";
import { useState, useEffect } from "react";
import CustomButton from "../components/CustomButton";

export default function BorrowerModal({
    open,
    mode = "add", // "add" | "edit"
    initialName = "",
    onCancel,
    onSubmit,
}) {

    const [name, setName] = useState("");

    useEffect(() => {
        setName(initialName || "");
    }, [initialName, open]);

    const isEdit = mode === "edit";

    return (
        <Modal
            open={open}
            footer={null}
            centered
            onCancel={onCancel}
            width={420}
            closable={false}
        >
            <div className="text-center space-y-2">

                <div className="flex justify-center">
                    {isEdit ? (
                        <UserPen className="w-7 h-5 text-Colors-Text-Primary-primary" />
                    ) : (
                        <UserPlus className="w-7 h-5 text-Colors-Text-Primary-primary" />
                    )}
                </div>

                <h2 className="text-lg  font-semibold">
                    {isEdit ? "Edit Borrower" : "Add Borrower"}
                </h2>

                <p className="text-gray-600 text-sm">
                    {isEdit ? (
                        "Update the borrower name"
                    ) : (
                        <>
                            Enter a new borrower name to add<br />
                            to the loan package
                        </>
                    )}
                </p>


                <div className="text-left mt-3">
                    <label className="text-sm font-medium ">New Borrower Name</label>
                    <Input
                        placeholder="Enter New Borrower Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-6"
                    />
                </div>

                <div className="flex gap-3 pt-4">

                    <CustomButton
                        type="button"
                        variant="outline"
                        className="flex-1  border-[#24A1DD] text-[#24A1DD] "
                        onClick={onCancel}
                    >
                        Cancel
                    </CustomButton>

                    <CustomButton
                        type="button"
                        variant={name.trim() ? "primary" : "disabled"}
                        className="flex-1 h-10 rounded-full font-medium"
                        onClick={() => onSubmit(name.trim())}
                    >
                        {isEdit ? "Save" : "Add"}
                    </CustomButton>

                </div>

            </div>
        </Modal>
    );
}
