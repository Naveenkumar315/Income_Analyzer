import axiosClient from './axiosClient';

/**
 * Notification API client for interacting with notification endpoints
 */

/**
 * Get current user's notifications with pagination
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of notifications per page
 * @param {boolean} unreadOnly - If true, only return unread notifications
 * @returns {Promise} - Notification list response
 */
export const getNotifications = async (page = 1, pageSize = 20, unreadOnly = false) => {
    const response = await axiosClient.get('/notifications/me', {
        params: { page, page_size: pageSize, unread_only: unreadOnly }
    });
    return response.data;
};

/**
 * Get count of unread notifications
 * @returns {Promise} - Object with unread_count
 */
export const getUnreadCount = async () => {
    const response = await axiosClient.get('/notifications/unread-count');
    return response.data;
};

/**
 * Mark a specific notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Promise} - Success response
 */
export const markAsRead = async (notificationId) => {
    const response = await axiosClient.put(`/notifications/${notificationId}/read`);
    return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} - Success response with count
 */
export const markAllAsRead = async () => {
    const response = await axiosClient.put('/notifications/mark-all-read');
    return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise} - Success response
 */
export const deleteNotification = async (notificationId) => {
    const response = await axiosClient.delete(`/notifications/${notificationId}`);
    return response.data;
};
