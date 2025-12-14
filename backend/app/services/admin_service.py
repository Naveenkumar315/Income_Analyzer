from fastapi import BackgroundTasks, HTTPException
from app.db import db, get_collection
from fastapi import HTTPException, BackgroundTasks
from bson import ObjectId
from datetime import datetime
from app.services.email_service import send_email
from app.utils.email_template import get_welcome_email_html, get_rejection_email_html
from app.utils.security import generate_secure_password, hash_password
import asyncio
import traceback
import re
EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


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
        raise HTTPException(
            status_code=500, detail=f"Error fetching users: {str(e)}")


async def update_user_status(
    user_id: str,
    new_status: str,
    background_tasks: BackgroundTasks
):
    valid_statuses = ["pending", "active", "inactive"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    users = get_collection("users")
    user = await users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build full name
    info = user.get("individualInfo") or {}
    first = info.get("firstName") or ""
    last = info.get("lastName") or ""
    full_name = (first + " " + last).strip() or user.get("email") or "User"

    user_email = user.get("email")
    if not user_email or not EMAIL_REGEX.match(user_email):
        raise HTTPException(status_code=400, detail="User has no valid email")

    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow(),
    }

    # Only ACTIVE generates password
    temp_password = None
    if new_status == "active":
        temp_password = generate_secure_password(12)
        update_data.update({
            "password": hash_password(temp_password),
            "is_first_time_user": True,
            "approvedOn": datetime.utcnow()
        })

    if new_status == "inactive":
        update_data["approvedOn"] = datetime.utcnow()

    await users.update_one({"_id": object_id}, {"$set": update_data})

    # ------------------------------------------------
    # 🔥 EMAILS — FIRE & FORGET (NO AWAIT ANYWHERE)
    # ------------------------------------------------
    if new_status == "active":
        background_tasks.add_task(
            send_email,
            to_email=user_email,
            subject="Welcome to Income Analyzer — Temporary Password",
            html_body=get_welcome_email_html(full_name, temp_password)
        )

    elif new_status == "inactive":
        background_tasks.add_task(
            send_email,
            to_email=user_email,
            subject="Income Analyzer — Account Request Update",
            html_body=get_rejection_email_html(full_name, reason = "")
        )

    # 🚀 RETURN IMMEDIATELY (NO WAIT)
    return {
        "message": f"User status updated to {new_status}",
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
        # If we passed the find_one check but failed here, it might be a race condition.
        # But for the client, if it's gone, it's success.
        pass

    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }
