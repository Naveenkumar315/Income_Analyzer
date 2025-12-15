import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../api/notificationApi';
import { getUserRole } from '../utils/authService';

const NotificationContext = createContext();

/**
 * NotificationProvider component to manage notification state globally
 */
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Only enable WebSocket for admin users
    const userRole = getUserRole();
    const isAdmin = userRole === 'admin';

    /**
     * Fetch notifications from API
     */
    const fetchNotifications = useCallback(async (page = 1, pageSize = 20) => {
        if (!isAdmin) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getNotifications(page, pageSize);
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    /**
     * Fetch unread count only
     */
    const fetchUnreadCount = useCallback(async () => {
        if (!isAdmin) return;

        try {
            const data = await getUnreadCount();
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, [isAdmin]);

    /**
     * Handle incoming WebSocket notification
     */
    const handleWebSocketNotification = useCallback((notification) => {
        console.log('New notification received via WebSocket:', notification);

        // Check if notification already exists to prevent duplicates
        let isNewNotification = false;

        setNotifications((prev) => {
            const exists = prev.some(n => n.id === notification.id);
            if (exists) {
                console.log('Duplicate notification detected, skipping:', notification.id);
                isNewNotification = false;
                return prev;
            }
            // Add notification to the beginning of the list
            isNewNotification = true;
            return [notification, ...prev];
        });

        // Increment unread count only if it's a new notification
        if (isNewNotification) {
            setUnreadCount((prev) => prev + 1);

            // Optional: Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico'
                });
            }
        }
    }, []);

    // WebSocket connection
    const { isConnected, error: wsError } = useWebSocket(
        handleWebSocketNotification,
        isAdmin // Only connect if user is admin
    );

    /**
     * Mark notification as read
     */
    const markNotificationAsRead = useCallback(async (notificationId) => {
        try {
            await markAsRead(notificationId);

            // Update local state
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );

            // Decrement unread count
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    }, []);

    /**
     * Mark all notifications as read
     */
    const markAllNotificationsAsRead = useCallback(async () => {
        try {
            await markAllAsRead();

            // Update local state
            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, is_read: true }))
            );

            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            throw err;
        }
    }, []);

    /**
     * Delete notification
     */
    const removeNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId);

            // Update local state
            const deletedNotif = notifications.find((n) => n.id === notificationId);
            setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

            // Decrement unread count if notification was unread
            if (deletedNotif && !deletedNotif.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    }, [notifications]);

    // Initial fetch on mount
    useEffect(() => {
        if (isAdmin) {
            fetchNotifications();

            // Request browser notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [isAdmin, fetchNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        isConnected,
        wsError,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

/**
 * Custom hook to use notification context
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export default NotificationContext;
