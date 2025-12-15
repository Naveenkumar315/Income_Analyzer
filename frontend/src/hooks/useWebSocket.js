import { useEffect, useRef, useCallback, useState } from 'react';
import { getAccessToken } from '../utils/authService';

/**
 * Custom hook for WebSocket connection to receive real-time notifications
 * @param {Function} onNotification - Callback function to handle incoming notifications
 * @param {boolean} enabled - Whether to enable WebSocket connection
 * @returns {Object} - WebSocket connection state and methods
 */
const useWebSocket = (onNotification, enabled = true) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds

    const connect = useCallback(() => {
        if (!enabled) return;

        const token = getAccessToken();
        if (!token) {
            console.warn('No access token available for WebSocket connection');
            return;
        }

        try {
            // Construct WebSocket URL
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const wsUrl = baseUrl.replace(/^http/, 'ws') + `/notifications/ws?token=${token}`;

            console.log('Connecting to WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    console.log('Received notification:', notification);

                    if (onNotification && typeof onNotification === 'function') {
                        onNotification(notification);
                    }
                } catch (err) {
                    console.error('Error parsing notification:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection error');
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);

                // Attempt to reconnect if not intentionally closed
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    setError('Max reconnection attempts reached');
                }
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError(err.message);
        }
    }, [enabled, onNotification]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    useEffect(() => {
        if (enabled) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [enabled, connect, disconnect]);

    return {
        isConnected,
        error,
        reconnect: connect,
        disconnect
    };
};

export default useWebSocket;
