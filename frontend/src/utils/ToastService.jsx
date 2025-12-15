// src/utils/toastService.jsx
import toast from "react-hot-toast";

const toastService = {
  success(message, options = {}) {
    toast.success(message, {
      id: options.id || message,
      duration: options.duration || 1000,
    });
  },

  error(message, options = {}) {
    toast.error(message, {
      id: options.id || message,
      duration: options.duration || 1000,
    });
  },

  info(message, options = {}) {
    toast(message, {
      id: options.id || message,
      duration: options.duration || 1000,
    });
  },
};

export default toastService;
