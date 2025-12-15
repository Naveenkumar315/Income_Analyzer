import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      maxVisible={1}
      reverseOrder={false}
     
    />
  );
}
