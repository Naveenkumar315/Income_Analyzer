from app.db import db
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.user import UserCreate, UserLogin, SignupRequest
from datetime import datetime
from fastapi import HTTPException, BackgroundTasks
from app.utils.email_template import get_admin_new_broker_signup_email_html, get_signup_submitted_email_html
from app.services.email_service import send_email


async def register_user(user: UserCreate):
    user.email = user.email.lower().strip()
    existing = await db["users"].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    now = datetime.utcnow()

    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed,
        "created_at": now,
        "updated_at": now,
    }

    await db["users"].insert_one(new_user)
    return {"message": "User registered successfully"}


async def login_user(user: UserLogin):
    print("LOGIN API CALLING!!!!!!")
    user.email = user.email.lower().strip()
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token_data = {"sub": str(db_user["_id"]), "email": db_user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "username": db_user.get("username", ""),
        "email": db_user["email"],
        "status": db_user.get("status", "pending"),
        "user_id": str(db_user["_id"]),
        "role": db_user.get("role", "user"),
        "is_first_time_user": db_user.get("is_first_time_user", False),
    }


async def signup_user(
    signup_data: SignupRequest,
    background_tasks: BackgroundTasks
):
    """
    Handle user signup and send emails asynchronously (non-blocking).
    """

    signup_data.email = signup_data.email.lower().strip()

    if signup_data.companyInfo:
        signup_data.companyInfo.companyEmail = signup_data.companyInfo.companyEmail.lower().strip()

    if signup_data.primaryContact:
        signup_data.primaryContact.email = signup_data.primaryContact.email.lower().strip()

    if signup_data.individualInfo:
        signup_data.individualInfo.email = signup_data.individualInfo.email.lower().strip()

    # Check if user already exists
    existing = await db["users"].find_one({"email": signup_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.utcnow()
    role = "user"
    isCompanyAdmin = False

    # Build username from first and last names based on user type
    if signup_data.type == "company":
        primary = signup_data.primaryContact
        full_name = f"{primary.firstName} {primary.lastName}".strip()
        role = "Admin"
        isCompanyAdmin = True
    else:  # individual
        info = signup_data.individualInfo
        full_name = f"{info.firstName} {info.lastName}".strip()
        role = "user"
        isCompanyAdmin = False

    user_document = {
        "email": signup_data.email,
        "role": role,
        "type": signup_data.type,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "username": full_name,  # Set username to full name
        "isCompanyAdmin": isCompanyAdmin,
    }

    # Add type-specific information
    if signup_data.type == "company":
        primary = signup_data.primaryContact

        user_document["companyInfo"] = signup_data.companyInfo.dict()
        user_document["companyAddress"] = signup_data.companyAddress.dict()
        user_document["primaryContact"] = signup_data.primaryContact.dict()

        admin_email_html = get_admin_new_broker_signup_email_html(
            name=full_name,
            email=primary.email,
            phone=primary.phone
        )

    else:  # individual
        info = signup_data.individualInfo

        user_document["individualInfo"] = signup_data.individualInfo.dict()

        admin_email_html = get_admin_new_broker_signup_email_html(
            name=full_name,
            email=info.email,
            phone=info.phone
        )

    # Insert user
    await db["users"].insert_one(user_document)

    # Email to user
    user_email_html = get_signup_submitted_email_html(full_name)

    background_tasks.add_task(
        send_email,
        to_email=signup_data.email,
        subject="Income Analyzer Onboarding Process Started",
        html_body=user_email_html
    )

    # Email to admin
    background_tasks.add_task(
        send_email,
        to_email="nmurugan@loandna.com",
        subject="New Broker Signup Request Submitted for Review",
        html_body=admin_email_html,
        cc_emails=""
    )

    # Return immediately (emails send in background)
    return {
        "message": "User registered successfully",
        "email": signup_data.email,
        "type": signup_data.type,
        "role": "user",
        "status": "pending"
    }


async def check_email_exists(email: str):
    email = email.lower().strip()
    existing = await db["users"].find_one({"email": email})

    if not existing:
        return {
            "exists": False,
            "email": email,
            "status": None,
        }

    return {
        "exists": True,
        "email": email,
        "status": existing.get("status"),
    }
