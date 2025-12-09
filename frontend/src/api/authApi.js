// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
    sendVerificationCode: (email) =>
        axiosClient.post("/auth/send-code", { email }),

    verifyCode: (email, code) =>
        axiosClient.post("/auth/verify-code", { email, code }),

    checkEmailExists: (email) =>
        axiosClient.post("/auth/check-email", { email }),

    updatePassword: (data) =>
        axiosClient.post('/auth/update-password', data),

    // Add more:
    login: (data) => axiosClient.post("/auth/login", data),
    signup: (data) => axiosClient.post("/auth/signup", data),

    // Admin APIs
    getAllUsers: () => axiosClient.get("/admin/users"),
    updateUserStatus: (userId, status) =>
        axiosClient.put(`/admin/users/${userId}/status`, { status }),
    deleteUser: (userId) =>
        axiosClient.delete(`/admin/users/${userId}`),
};

export default authApi;
