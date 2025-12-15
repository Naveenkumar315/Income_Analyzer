import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import '../styles/NotificationBell.css';

/**
 * NotificationBell component - Bell icon with unread badge and dropdown toggle
 */
const NotificationBell = () => {
    const { unreadCount, isConnected } = useNotifications();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-button"
                onClick={toggleDropdown}
                aria-label="Notifications"
                title={`${unreadCount} unread notifications`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="bell-icon"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {/* Connection status indicator */}
                <span
                    className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                ></span>
            </button>

            <NotificationDropdown
                isOpen={isDropdownOpen}
                onClose={closeDropdown}
            />
        </div>
    );
};

export default NotificationBell;
