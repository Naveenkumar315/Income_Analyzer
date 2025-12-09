from app.db import db
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime


async def get_all_users():
    """
    Fetch all users from the database.
    Returns list of users with their details.
    """
    try:
        users = await db["users"].find({}).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user["_id"] = str(user["_id"])
            
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")


async def update_user_status(user_id: str, new_status: str):
    """
    Update user status (pending, active, inactive).
    Also updates the approvedOn timestamp if status is changed to active or inactive.
    """
    # Validate status
    valid_statuses = ["pending", "active", "inactive"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Check if user exists
    user = await db["users"].find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow()
    }
    
    # Add approvedOn timestamp if status is being set to active or inactive
    if new_status in ["active", "inactive"]:
        update_data["approvedOn"] = datetime.utcnow()
    
    # Update user
    result = await db["users"].update_one(
        {"_id": object_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user status")
    
    return {
        "message": f"User status updated to {new_status}",
        "user_id": user_id,
        "status": new_status
    }


async def delete_user(user_id: str):
    """
    Permanently delete a user from the database.
    """
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Check if user exists
    user = await db["users"].find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user
    result = await db["users"].delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Failed to delete user")
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }

