# app/services/send_code.py
from datetime import datetime, timedelta
from fastapi import HTTPException, BackgroundTasks
from pymongo.collection import Collection
import random
import string
import os
from typing import Optional, Dict, Any

from app.db import get_db
from app.models.user import SendCodeRequest, VerifyCodeRequest
from app.utils.email_template import get_verification_code_email
# Keep your existing send_email implementation (assumed signature: send_email(to_email, subject, html_body, ...))
from app.services.email_service import send_email

OTP_TTL_SECONDS = 600        # 10 minutes
MAX_ATTEMPTS = 5

# Optional Celery toggle
USE_CELERY = os.getenv("USE_CELERY", "0") in ("1", "true", "True")
if USE_CELERY:
    try:
        from celery import Celery
        CELERY_BROKER_URL = os.getenv(
            "CELERY_BROKER_URL", "redis://localhost:6379/0")
        CELERY_BACKEND = os.getenv(
            "CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
        celery_app = Celery(
            "otp_tasks", broker=CELERY_BROKER_URL, backend=CELERY_BACKEND)

        @celery_app.task(name="send_verification_email_task", bind=False)
        def send_verification_email_task(to_email: str, subject: str, html_body: str):
            # Use your sync send_email inside the worker (same signature)
            return send_email(to_email=to_email, subject=subject, html_body=html_body)
    except Exception as ex:
        # If celery import fails for any reason, fallback to BackgroundTasks behavior
        USE_CELERY = False
        celery_app = None


def generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _upsert_code_record(email: str, code: str) -> Dict[str, Any]:
    """Upsert OTP record and return metadata."""
    expires_at = datetime.utcnow() + timedelta(seconds=OTP_TTL_SECONDS)
    db = get_db()
    collection = db.get_collection('verification_codes')
    now = datetime.utcnow()

    collection.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "code": code,
                "attempts": 0,
                "expiresAt": expires_at,
                "isUsed": False,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    return {
        "email": email,
        "expiresAt": expires_at,
        "expiresIn": OTP_TTL_SECONDS
    }


def send_verification_code(request: SendCodeRequest, background_tasks: Optional[BackgroundTasks] = None) -> Dict[str, Any]:
    """
    Generate OTP, upsert into MongoDB, and schedule email send asynchronously.

    - If USE_CELERY=1 -> enqueue a Celery task (recommended for production).
    - Otherwise, if a FastAPI BackgroundTasks instance is provided -> add background task (in-process).
    - If neither is available, send synchronously as a last resort.
    """
    email = request.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    # Generate code and persist immediately
    code = generate_code(6)
    meta = _upsert_code_record(email, code)

    # Build email content (HTML)
    html = get_verification_code_email(code=code, email=email)

    dispatch_method = "none"

    # Prefer Celery enqueue if enabled
    if USE_CELERY and 'celery_app' in globals() and celery_app is not None:
        try:
            # Enqueue the task with minimal args (matching worker signature)
            send_verification_email_task.apply_async(
                args=[email, "Your Verification Code", html],
                queue="send_email_queue",
                retry=False
            )
            dispatch_method = "celery_enqueued"
        except Exception as ex:
            # If enqueue fails, fall back to BackgroundTasks or synchronous send
            dispatch_method = "celery_enqueue_failed"
            if background_tasks is not None:
                background_tasks.add_task(
                    send_email, email, "Your Verification Code", html)
                dispatch_method = "background_tasks_added_after_celery_fail"
            else:
                # synchronous fallback
                try:
                    send_email(
                        to_email=email, subject="Your Verification Code", html_body=html)
                    dispatch_method = "sent_synchronously_after_celery_fail"
                except Exception as ex2:
                    dispatch_method = "sync_send_failed"
                    print(
                        "Failed to send email synchronously after celery enqueue failure:", ex2)
    elif background_tasks is not None:
        # Add to FastAPI BackgroundTasks (non-blocking for request)
        # NOTE: send_email signature expected: send_email(to_email, subject, html_body)
        background_tasks.add_task(
            send_email, to_email=email, subject="Your Verification Code", html_body=html)
        dispatch_method = "background_tasks_added"
    else:
        # Last-resort synchronous send (blocks): avoid in production
        try:
            send_email(to_email=email,
                       subject="Your Verification Code", html_body=html)
            dispatch_method = "sent_synchronously"
        except Exception as ex:
            dispatch_method = "sync_send_failed"
            print("Synchronous email send failed:", ex)

    # Optional debug print (remove or replace with proper logging in production)
    print(
        f"[OTP] code for {email} generated — dispatch_method={dispatch_method}")

    return {
        "message": "Verification code queued for sending",
        "email": email,
        "expiresIn": meta["expiresIn"],
        "expiresAt": meta["expiresAt"].isoformat(),
        "dispatchMethod": dispatch_method
    }


async def verify_otp_code(request: VerifyCodeRequest) -> bool:
    """
    Validate OTP from MongoDB, handle attempts, mark as used.
    """

    print('***********************************************')

    email = request.email.lower().strip()
    input_code = request.code
    db = get_db()  # this is your Motor async DB instance
    collection = db.get_collection("verification_codes")

    # MUST await async find_one()
    doc = await collection.find_one({"email": email})
    print("Fetched doc:", doc)
    if not doc:
        raise HTTPException(
            status_code=400, detail="No verification code found.")

    if doc.get("isUsed"):
        raise HTTPException(
            status_code=400, detail="Verification code already used.")

    # expiry check
    expires_at = doc.get("expiresAt")
    if not expires_at or datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=400, detail="Verification code has expired.")

    attempts = int(doc.get("attempts") or 0)
    if attempts >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail="Too many failed attempts. Please request a new code.",
        )

    stored_code = doc.get("code")
    if stored_code != input_code:
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"attempts": attempts + 1, "updatedAt": datetime.utcnow()}},
        )
        raise HTTPException(
            status_code=400, detail="Invalid verification code.")

    # success → mark as used
    collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"isUsed": True, "updatedAt": datetime.utcnow()}},
    )

    return True
