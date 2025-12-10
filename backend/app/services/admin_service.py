from app.db import db, get_collection
from fastapi import HTTPException, BackgroundTasks
from bson import ObjectId
from datetime import datetime
from app.services.email_service import send_email
from app.utils.email_template import get_welcome_email_html
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


async def update_user_status(user_id: str, new_status: str, background_tasks: BackgroundTasks | None = None):
    valid_statuses = ["pending", "active", "inactive"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    users = get_collection("users")
    user = await users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build full name safely
    info = user.get("individualInfo") or {}
    first = info.get("firstName") or ""
    last = info.get("lastName") or ""
    full_name = (first + " " + last).strip() or user.get("email") or "User"

    user_email = user.get("email")
    if not user_email or not EMAIL_REGEX.match(user_email):
        # mark failure and return
        await users.update_one({"_id": object_id}, {"$set": {"emailSendFailedAt": datetime.utcnow()}})
        raise HTTPException(
            status_code=400, detail="User has no valid email on record")

    # Generate & hash temp password
    temp_password = generate_secure_password(12)
    hashed = hash_password(temp_password)

    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow(),
        "password": hashed,
        "is_first_time_user": True,
    }
    if new_status in ["active", "inactive"]:
        update_data["approvedOn"] = datetime.utcnow()

    result = await users.update_one({"_id": object_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(
            status_code=500, detail="Failed to update user status")

    # Prepare email
    subject = "Welcome to Income Analyzer — Temporary Password"
    html_body = get_welcome_email_html(full_name, temp_password)

    # Send email (non-blocking where possible)
    send_failed = False
    try:
        if background_tasks:
            # pass keyword args as send_email expects them
            background_tasks.add_task(
                send_email, to_email=user_email, subject=subject, html_body=html_body)
        else:
            # offload blocking call to thread so event loop isn't blocked
            await asyncio.to_thread(send_email, to_email=user_email, subject=subject, html_body=html_body)
    except Exception as ex:
        send_failed = True
        # logging - replace prints with your logger
        print(f"Email send failed to {user_email}: {ex}")
        traceback.print_exc()
        # record failure timestamp so a retry job can pick it up
        await users.update_one({"_id": object_id}, {"$set": {"emailSendFailedAt": datetime.utcnow()}})

    if send_failed:
        return {"message": f"Status updated to {new_status}, but email send failed", "status": new_status, "email_status": "failed"}

    return {"message": f"User status updated to {new_status}", "status": new_status, "email_status": "sent"}


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
