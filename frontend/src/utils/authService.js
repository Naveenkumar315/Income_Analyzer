// src/utils/authService.js

/**
 * Authentication service for managing JWT tokens in session storage
 */

const TOKEN_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_EMAIL: 'user_email',
    USER_ROLE: 'user_role',
    USER_ID: 'user_id'
};

/**
 * Save authentication tokens to session storage
 */
export const setTokens = (accessToken, refreshToken, userData = {}) => {
    sessionStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    sessionStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    if (userData.email) {
        sessionStorage.setItem(TOKEN_KEYS.USER_EMAIL, userData.email);
    }
    if (userData.role) {
        sessionStorage.setItem(TOKEN_KEYS.USER_ROLE, userData.role);
    }
    if (userData.user_id) {
        sessionStorage.setItem(TOKEN_KEYS.USER_ID, userData.user_id);
    }
};

/**
 * Get access token from session storage
 */
export const getAccessToken = () => {
    return sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from session storage
 */
export const getRefreshToken = () => {
    return sessionStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Get user data from session storage
 */
export const getUserData = () => {
    return {
        email: sessionStorage.getItem(TOKEN_KEYS.USER_EMAIL),
        role: sessionStorage.getItem(TOKEN_KEYS.USER_ROLE),
        user_id: sessionStorage.getItem(TOKEN_KEYS.USER_ID)
    };
};

/**
 * Clear all authentication data from session storage
 */
export const clearTokens = () => {
    sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(TOKEN_KEYS.USER_EMAIL);
    sessionStorage.removeItem(TOKEN_KEYS.USER_ROLE);
    sessionStorage.removeItem(TOKEN_KEYS.USER_ID);

    // Also clear localStorage items for backward compatibility
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
};

/**
 * Check if user is authenticated (has valid tokens)
 */
export const isAuthenticated = () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    return !!(accessToken && refreshToken);
};

/**
 * Update only the access token (used after refresh)
 */
export const updateAccessToken = (accessToken) => {
    sessionStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
};

export default {
    setTokens,
    getAccessToken,
    getRefreshToken,
    getUserData,
    clearTokens,
    isAuthenticated,
    updateAccessToken
};
