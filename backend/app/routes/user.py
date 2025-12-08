# app/routes/user.py
from fastapi import APIRouter, HTTPException, Body
from app.db import db
from bson import ObjectId
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def get_users():
    users = await db["users"].find().to_list(100)
    return users

@router.get("/admin-table")
async def get_users_for_admin():
    """
    Fetch all users with role='user' for the admin table.
    Adds default status='pending' if not present.
    """
    users = await db["users"].find({"role": "user"}).to_list(1000)
    
    # Convert ObjectId to string and ensure status field exists
    result = []
    for user in users:
        user["_id"] = str(user["_id"])
        if "status" not in user:
            user["status"] = "pending"
        result.append(user)
    
    return {"users": result}

@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str = Body(..., embed=True)
):
    """
    Update user status. Valid values: active, reject, pending
    """
    # Validate status
    valid_statuses = ["active", "reject", "pending"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Validate ObjectId
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Check if user exists
    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update status
    timestamp = datetime.utcnow()
    await db["users"].update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": status,
                "updated_at": timestamp
            }
        }
    )
    
    return {
        "message": "Status updated successfully",
        "user_id": user_id,
        "status": status
    }

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """
    Delete a user from the database
    """
    # Validate ObjectId
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Check if user exists
    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user
    await db["users"].delete_one({"_id": obj_id})
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }
