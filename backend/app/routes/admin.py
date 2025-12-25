from fastapi import APIRouter, BackgroundTasks
from app.services.admin_service import get_all_users, update_user_status, delete_user, fetch_user_by_email, update_user_role
from pydantic import BaseModel
from app.models.user import CreateCompanyUserRequest, UpdateRoleRequest
from app.services.create_company_user import create_company_user

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateStatusRequest(BaseModel):
    status: str  # "pending", "active", "inactive"


class GetUserRequest(BaseModel):
    email: str


@router.get("/users")
async def get_users():
    """
    Get all users from the database.
    Returns list of users with their details.
    """
    return await get_all_users()


@router.post('/get-user')
async def get_user(payload: GetUserRequest):
    return await fetch_user_by_email(payload)


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


@router.post("/inser-company-user")
async def insertcompanyuser(payload: CreateCompanyUserRequest):
    return await create_company_user(payload)


@router.patch("/update-user-role/{user_id}")
async def updateuser_role(user_id: str, payload: UpdateRoleRequest):
    return await update_user_role(user_id, payload)
