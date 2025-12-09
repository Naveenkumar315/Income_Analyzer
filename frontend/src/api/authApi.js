// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
    sendVerificationCode: (email) =>
        axiosClient.post("/auth/send-code", { email }),

    verifyCode: (email, code) =>
        axiosClient.post("/auth/verify-code", { email, code }),

    checkEmailExists: (email) =>
        axiosClient.post("/auth/check-email", { email }),

    // Add more:
    login: (data) => axiosClient.post("/auth/login", data),
    signup: (data) => axiosClient.post("/auth/signup", data),

    // Admin APIs
    getAllUsers: () => axiosClient.get("/admin/users"),
    updateUserStatus: (userId, status) =>
        axiosClient.put(`/admin/users/${userId}/status`, { status }),
};

export default authApi;
