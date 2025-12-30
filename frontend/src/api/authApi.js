// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
    sendVerificationCode: (email) =>
        axiosClient.post("/auth/send-code", { email }),

    verifyCode: (email, code) =>
        axiosClient.post("/auth/verify-code", { email, code }),

    checkEmailExists: (email) =>
        axiosClient.post("/auth/check-email", { email }),

    checkCompanyExists: (data) =>
        axiosClient.post("/auth/check-company", {   
            email: data.email,
            name: data.name,
        }),

    updatePassword: (data) =>
        axiosClient.post('/auth/update-password', data),

    login: (data) => axiosClient.post("/auth/login", data),
    signup: (data) => axiosClient.post("/auth/signup", data),
    ssoExchange: (data) => axiosClient.post("/sso-exchange", data),

    // Admin APIs
    getAllUsers: () => axiosClient.get("/admin/users"),
    getUserByEmail: (userId) => axiosClient.post(`/admin/get-user`, userId),

    updateUserStatus: (userId, status) => axiosClient.put(`/admin/users/${userId}/status`, { status }),
    updateUserRole: (userId, role) => axiosClient.patch(`/admin/update-user-role/${userId}`, { role }),
    deleteUser: (userId) => axiosClient.delete(`/admin/users/${userId}`),
    createCompanyUser: (data) => axiosClient.post('/admin/inser-company-user', data),
};

export default authApi;
