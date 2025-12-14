from fastapi import APIRouter, BackgroundTasks
from app.services.admin_service import get_all_users, update_user_status, delete_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateStatusRequest(BaseModel):
    status: str  # "pending", "active", "inactive"


@router.get("/users")
async def get_users():
    """
    Get all users from the database.
    Returns list of users with their details.
    """
    return await get_all_users()


@router.put("/users/{user_id}/status")
async def update_status(user_id: str, request: UpdateStatusRequest, background_tasks: BackgroundTasks):
    """
    Update user status (approve/reject).
    - status: "active" for approve
    - status: "inactive" for reject
    - status: "pending" to reset
    """
    return await update_user_status(user_id, request.status, background_tasks)


@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: str):
    """
    Permanently delete a user from the database.
    """
    return await delete_user(user_id)

