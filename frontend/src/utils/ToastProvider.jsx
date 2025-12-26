import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      maxVisible={1}
      reverseOrder={false}

    />
  );
}
