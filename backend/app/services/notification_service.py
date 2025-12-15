from app.db import db
from app.models.notification import NotificationCreate, NotificationResponse, NotificationType
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


async def create_notification(
    recipient_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Create a new notification in the database.
    
    Args:
        recipient_id: User ID who will receive the notification
        notification_type: Type of notification (from NotificationType enum)
        title: Notification title
        message: Notification message
        metadata: Additional metadata (optional)
    
    Returns:
        str: ID of the created notification
    """
    now = datetime.utcnow()
    
    notification_doc = {
        "recipient_id": recipient_id,
        "type": notification_type.value if isinstance(notification_type, NotificationType) else notification_type,
        "title": title,
        "message": message,
        "metadata": metadata or {},
        "is_read": False,
        "created_at": now,
        "read_at": None
    }
    
    result = await db["notifications"].insert_one(notification_doc)
    logger.info(f"Created notification {result.inserted_id} for user {recipient_id}")
    
    return str(result.inserted_id)


async def get_user_notifications(
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False
) -> Dict[str, Any]:
    """
    Get notifications for a specific user with pagination.
    
    Args:
        user_id: User ID to fetch notifications for
        skip: Number of notifications to skip (for pagination)
        limit: Maximum number of notifications to return
        unread_only: If True, only return unread notifications
    
    Returns:
        Dict containing notifications list, total count, and unread count
    """
    query = {"recipient_id": user_id}
    
    if unread_only:
        query["is_read"] = False
    
    # Get total count
    total = await db["notifications"].count_documents(query)
    
    # Get unread count
    unread_count = await db["notifications"].count_documents({
        "recipient_id": user_id,
        "is_read": False
    })
    
    # Get notifications with pagination, sorted by created_at descending
    cursor = db["notifications"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    notifications = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for notif in notifications:
        notif["id"] = str(notif.pop("_id"))
    
    return {
        "notifications": notifications,
        "total": total,
        "unread_count": unread_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit
    }


async def mark_as_read(user_id: str, notification_ids: Optional[List[str]] = None) -> int:
    """
    Mark notification(s) as read.
    
    Args:
        user_id: User ID (for security - only mark user's own notifications)
        notification_ids: List of notification IDs to mark as read. If None, mark all as read.
    
    Returns:
        int: Number of notifications marked as read
    """
    now = datetime.utcnow()
    
    query = {
        "recipient_id": user_id,
        "is_read": False
    }
    
    if notification_ids:
        # Convert string IDs to ObjectId
        object_ids = [ObjectId(nid) for nid in notification_ids if ObjectId.is_valid(nid)]
        query["_id"] = {"$in": object_ids}
    
    result = await db["notifications"].update_many(
        query,
        {"$set": {"is_read": True, "read_at": now}}
    )
    
    logger.info(f"Marked {result.modified_count} notifications as read for user {user_id}")
    return result.modified_count


async def delete_notification(user_id: str, notification_id: str) -> bool:
    """
    Delete a notification.
    
    Args:
        user_id: User ID (for security - only delete user's own notifications)
        notification_id: Notification ID to delete
    
    Returns:
        bool: True if deleted, False if not found
    """
    if not ObjectId.is_valid(notification_id):
        return False
    
    result = await db["notifications"].delete_one({
        "_id": ObjectId(notification_id),
        "recipient_id": user_id
    })
    
    logger.info(f"Deleted notification {notification_id} for user {user_id}")
    return result.deleted_count > 0


async def get_unread_count(user_id: str) -> int:
    """
    Get count of unread notifications for a user.
    
    Args:
        user_id: User ID
    
    Returns:
        int: Count of unread notifications
    """
    count = await db["notifications"].count_documents({
        "recipient_id": user_id,
        "is_read": False
    })
    
    return count


async def notify_admins(
    notification_type: NotificationType,
    title: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> List[str]:
    """
    Create notifications for all admin users.
    
    Args:
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        metadata: Additional metadata (optional)
    
    Returns:
        List[str]: List of created notification IDs
    """
    # Fetch all admin users
    admin_users = await db["users"].find({"role": "admin"}).to_list(length=None)
    
    if not admin_users:
        logger.warning("No admin users found to notify")
        return []
    
    notification_ids = []
    
    # Create notification for each admin
    for admin in admin_users:
        notification_id = await create_notification(
            recipient_id=str(admin["_id"]),
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata
        )
        notification_ids.append(notification_id)
    
    logger.info(f"Created {len(notification_ids)} notifications for {len(admin_users)} admins")
    return notification_ids


async def create_user_registration_notification(user_email: str, username: str, user_type: str) -> List[str]:
    """
    Helper function to create user registration notifications for all admins.
    
    Args:
        user_email: Email of the newly registered user
        username: Username of the newly registered user
        user_type: Type of user (company/individual)
    
    Returns:
        List[str]: List of created notification IDs
    """
    title = "New User Registration"
    message = f"New {user_type} user '{username}' ({user_email}) has registered and is pending approval."
    
    metadata = {
        "user_email": user_email,
        "username": username,
        "user_type": user_type,
        "action_required": True
    }
    
    return await notify_admins(
        notification_type=NotificationType.USER_REGISTRATION,
        title=title,
        message=message,
        metadata=metadata
    )
