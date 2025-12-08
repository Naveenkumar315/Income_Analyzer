// src/api/axiosClient.js
import axios from "axios";

// ----------------------------------
// BASE AXIOS INSTANCE
// ----------------------------------
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",  // ⬅ your FastAPI base URL
    timeout: 10000,                     // 10 seconds
    headers: {
        "Content-Type": "application/json",
    },
});

// ----------------------------------
// REQUEST INTERCEPTOR
// Add token automatically
// ----------------------------------
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ----------------------------------
// RESPONSE INTERCEPTOR
// Global error handling
// ----------------------------------
axiosClient.interceptors.response.use(
    (response) => response.data, // always return clean data
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            console.warn("Unauthorized → redirect to login");
            // You can auto-logout here:
            // localStorage.removeItem("auth_token");
        }

        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
