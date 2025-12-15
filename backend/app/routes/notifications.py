from fastapi import APIRouter, Depends, Query, HTTPException, WebSocket, WebSocketDisconnect
from app.models.notification import NotificationListResponse, MarkAsReadRequest
from app.services.notification_service import (
    get_user_notifications,
    mark_as_read,
    delete_notification,
    get_unread_count
)
from app.services.websocket_manager import websocket_manager
from app.utils.deps import get_current_user
from app.utils.security import verify_token
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=NotificationListResponse)
async def get_my_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's notifications with pagination.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of notifications per page
        unread_only: If True, only return unread notifications
        current_user: Current authenticated user
    
    Returns:
        NotificationListResponse with notifications and metadata
    """
    user_id = current_user["user_id"]
    skip = (page - 1) * page_size
    
    result = await get_user_notifications(
        user_id=user_id,
        skip=skip,
        limit=page_size,
        unread_only=unread_only
    )
    
    return result


@router.get("/unread-count")
async def get_unread_notification_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Get count of unread notifications for current user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Dict with unread_count
    """
    user_id = current_user["user_id"]
    count = await get_unread_count(user_id)
    
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    
    Args:
        notification_id: ID of the notification to mark as read
        current_user: Current authenticated user
    
    Returns:
        Success message
    """
    user_id = current_user["user_id"]
    count = await mark_as_read(user_id, [notification_id])
    
    if count == 0:
        raise HTTPException(status_code=404, detail="Notification not found or already read")
    
    return {"message": "Notification marked as read", "count": count}


@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all notifications as read for current user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Success message with count of marked notifications
    """
    user_id = current_user["user_id"]
    count = await mark_as_read(user_id, None)
    
    return {"message": f"Marked {count} notifications as read", "count": count}


@router.delete("/{notification_id}")
async def delete_notification_endpoint(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a notification.
    
    Args:
        notification_id: ID of the notification to delete
        current_user: Current authenticated user
    
    Returns:
        Success message
    """
    user_id = current_user["user_id"]
    success = await delete_notification(user_id, notification_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted successfully"}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket endpoint for real-time notifications.
    
    Clients should connect with their access token as a query parameter:
    ws://localhost:8080/notifications/ws?token=<access_token>
    
    Args:
        websocket: WebSocket connection
        token: JWT access token for authentication
    """
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    try:
        # Verify token and get user info
        payload = verify_token(token, token_type="access")
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Connect the WebSocket
        await websocket_manager.connect(websocket, user_id)
        logger.info(f"WebSocket connected for user {user_id}")
        
        try:
            # Keep connection alive and handle incoming messages
            while True:
                # Wait for any message from client (ping/pong or other commands)
                data = await websocket.receive_text()
                
                # You can handle client messages here if needed
                # For now, we just keep the connection alive
                logger.debug(f"Received message from user {user_id}: {data}")
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
        finally:
            websocket_manager.disconnect(websocket, user_id)
            
    except ValueError as e:
        logger.error(f"Token verification failed: {e}")
        await websocket.close(code=1008, reason="Invalid or expired token")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=1011, reason="Internal server error")
