from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Enum for different notification types - easily extensible"""
    USER_REGISTRATION = "USER_REGISTRATION"
    LOAN_UPLOAD = "LOAN_UPLOAD"
    ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE"
    STATUS_CHANGE = "STATUS_CHANGE"
    SYSTEM_ALERT = "SYSTEM_ALERT"


class NotificationBase(BaseModel):
    """Base notification model with core fields"""
    type: NotificationType
    title: str
    message: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        use_enum_values = True


class NotificationCreate(NotificationBase):
    """Model for creating a new notification"""
    recipient_id: str  # User ID who will receive the notification
    

class NotificationInDB(NotificationBase):
    """Database representation of a notification"""
    id: str = Field(alias="_id")
    recipient_id: str
    is_read: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True
        populate_by_name = True


class NotificationResponse(BaseModel):
    """API response model for notifications"""
    id: str
    type: str
    title: str
    message: str
    metadata: Dict[str, Any]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class NotificationListResponse(BaseModel):
    """Response model for paginated notification list"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int


class MarkAsReadRequest(BaseModel):
    """Request model for marking notifications as read"""
    notification_ids: Optional[List[str]] = None  # If None, mark all as read
