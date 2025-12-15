import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationItem component - Individual notification display
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
    const { id, type, title, message, is_read, created_at } = notification;

    // Get icon based on notification type
    const getNotificationIcon = () => {
        switch (type) {
            case 'USER_REGISTRATION':
                return (
                    <div className="notification-icon user-registration">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="19" y1="8" x2="19" y2="14"></line>
                            <line x1="22" y1="11" x2="16" y2="11"></line>
                        </svg>
                    </div>
                );
            case 'LOAN_UPLOAD':
                return (
                    <div className="notification-icon loan-upload">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                );
            case 'ANALYSIS_COMPLETE':
                return (
                    <div className="notification-icon analysis-complete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="notification-icon default">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </div>
                );
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    const handleClick = () => {
        if (!is_read && onMarkAsRead) {
            onMarkAsRead(id);
        }
    };

    return (
        <div
            className={`notification-item ${is_read ? 'read' : 'unread'}`}
            onClick={handleClick}
        >
            {getNotificationIcon()}

            <div className="notification-content">
                <div className="notification-header">
                    <h4 className="notification-title">{title}</h4>
                    <span className="notification-time">{formatTime(created_at)}</span>
                </div>
                <p className="notification-message">{message}</p>
            </div>

            {onDelete && (
                <button
                    className="notification-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    aria-label="Delete notification"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            )}

            {!is_read && <div className="unread-indicator"></div>}
        </div>
    );
};

export default NotificationItem;
