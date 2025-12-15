import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import '../styles/NotificationDropdown.css';

/**
 * NotificationDropdown component - Displays notification list in a dropdown panel
 */
const NotificationDropdown = ({ isOpen, onClose }) => {
    const {
        notifications,
        unreadCount,
        loading,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
    } = useNotifications();

    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await removeNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-dropdown-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        className="mark-all-read-btn"
                        onClick={handleMarkAllAsRead}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notification-dropdown-body">
                {loading && notifications.length === 0 ? (
                    <div className="notification-loading">
                        <div className="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <p>No notifications yet</p>
                        <span>You're all caught up!</span>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="notification-dropdown-footer">
                    <button className="view-all-btn">View all notifications</button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
