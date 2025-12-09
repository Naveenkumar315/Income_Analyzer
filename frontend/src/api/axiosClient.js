// src/api/axiosClient.js
import axios from "axios";
import { getAccessToken, getRefreshToken, updateAccessToken, clearTokens } from "../utils/authService";

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

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ----------------------------------
// REQUEST INTERCEPTOR
// Add access token automatically
// ----------------------------------
axiosClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ----------------------------------
// RESPONSE INTERCEPTOR
// Handle token refresh on 401
// ----------------------------------
axiosClient.interceptors.response.use(
    (response) => response.data, // always return clean data
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // If 401 and we haven't tried to refresh yet
        if (status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();

            if (!refreshToken) {
                // No refresh token, redirect to login
                clearTokens();
                window.location.href = '/';
                return Promise.reject(error);
            }

            try {
                // Call refresh endpoint
                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/auth/refresh`,
                    { refresh_token: refreshToken }
                );

                const newAccessToken = response.data.access_token;
                updateAccessToken(newAccessToken);

                // Process queued requests
                processQueue(null, newAccessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;

