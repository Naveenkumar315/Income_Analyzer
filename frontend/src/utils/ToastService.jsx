// src/utils/toastService.jsx
import toast from "react-hot-toast";

const DEFAULT_DURATION = 2500;

const toastService = {
  success(message, options = {}) {
    toast.success(message, {
      id: options.id || message,
      duration: options.duration ?? DEFAULT_DURATION,
    });
  },

  error(message, options = {}) {
    toast.error(message, {
      id: options.id || message,
      duration: options.duration ?? DEFAULT_DURATION,
    });
  },

  info(message, options = {}) {
    toast(message, {
      id: options.id || message,
      duration: options.duration ?? DEFAULT_DURATION,
    });
  },
};

export default toastService;
