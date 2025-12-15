from fastapi import WebSocket
from typing import Dict, List
import logging
import json

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time notifications.
    Maintains a mapping of user_id -> list of active WebSocket connections.
    """
    
    def __init__(self):
        # Dictionary mapping user_id to list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """
        Accept and register a new WebSocket connection for a user.
        
        Args:
            websocket: The WebSocket connection
            user_id: User ID associated with this connection
        """
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """
        Remove a WebSocket connection for a user.
        
        Args:
            websocket: The WebSocket connection to remove
            user_id: User ID associated with this connection
        """
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                logger.info(f"WebSocket disconnected for user {user_id}. Remaining connections: {len(self.active_connections[user_id])}")
            
            # Clean up empty lists
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_notification(self, user_id: str, notification: dict):
        """
        Send a notification to a specific user across all their active connections.
        
        Args:
            user_id: User ID to send notification to
            notification: Notification data (will be JSON serialized)
        """
        if user_id not in self.active_connections:
            logger.debug(f"No active connections for user {user_id}")
            return
        
        # Convert notification to JSON string
        message = json.dumps(notification)
        
        # Send to all active connections for this user
        disconnected_sockets = []
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_text(message)
                logger.debug(f"Sent notification to user {user_id}")
            except Exception as e:
                logger.error(f"Error sending notification to user {user_id}: {e}")
                disconnected_sockets.append(connection)
        
        # Clean up any failed connections
        for socket in disconnected_sockets:
            self.disconnect(socket, user_id)
    
    async def broadcast(self, notification: dict):
        """
        Broadcast a notification to all connected users.
        Useful for system-wide announcements.
        
        Args:
            notification: Notification data (will be JSON serialized)
        """
        message = json.dumps(notification)
        
        for user_id, connections in list(self.active_connections.items()):
            disconnected_sockets = []
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected_sockets.append(connection)
            
            # Clean up any failed connections
            for socket in disconnected_sockets:
                self.disconnect(socket, user_id)
    
    def get_connection_count(self, user_id: str = None) -> int:
        """
        Get the number of active connections.
        
        Args:
            user_id: If provided, returns connection count for specific user.
                    If None, returns total connection count across all users.
        
        Returns:
            int: Number of active connections
        """
        if user_id:
            return len(self.active_connections.get(user_id, []))
        else:
            return sum(len(connections) for connections in self.active_connections.values())
    
    def get_connected_users(self) -> List[str]:
        """
        Get list of user IDs with active connections.
        
        Returns:
            List[str]: List of user IDs
        """
        return list(self.active_connections.keys())


# Global instance to be used across the application
websocket_manager = ConnectionManager()
