from fastapi import HTTPException, BackgroundTasks
from datetime import datetime
from bson import ObjectId
from app.models.user import CreateCompanyUserRequest
from app.db import get_db

db = get_db()


async def create_company_user(user_data: CreateCompanyUserRequest):
    # 1) normalize email
    user_data.email = user_data.email.lower().strip()

    # 2) check duplicate email
    existing = await db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3) fetch company admin
    admin = await db["users"].find_one({
        "_id": ObjectId(user_data.company_admin_id),
        "isCompanyAdmin": True
    })

    if not admin:
        raise HTTPException(status_code=404, detail="Company admin not found")

    # 4) read company size text like "1-10"
    size_text = admin["companyInfo"]["companySize"]

    # ---- convert to limit ----
    def get_company_limit(size_text: str) -> int:
        size_text = size_text.strip().replace(" ", "").lower()

        if "-" in size_text:
            return int(size_text.split("-")[1])

        if size_text.endswith("+"):
            return int(size_text[:-1])

        return 10

    max_limit = get_company_limit(size_text)

    # 5) count existing users in same company
    current_users = await db["users"].count_documents({
        "company_id": str(admin["_id"])
    })

    # 6) enforce limit
    if current_users >= max_limit:
        raise HTTPException(
            status_code=400,
            detail=f"User limit reached ({current_users}/{max_limit})"
        )

    # 7) build new user document
    now = datetime.utcnow()

    new_user = {
        "email": user_data.email,
        "username": f"{user_data.firstName} {user_data.lastName}",
        "role": user_data.role,
        "type": "company",
        "status": "pending",

        "isCompanyAdmin": user_data.role == "Admin",

        #  important: reference company, DO NOT duplicate company info
        "company_id": str(admin["_id"]),

        "primaryContact": {
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "email": user_data.email,
            "phone": user_data.phone
        },

        "created_at": now,
        "updated_at": now,
    }

    # 8) insert user
    await db["users"].insert_one(new_user)

    return {
        "message": "Company user created successfully",
        "current_users": current_users + 1,
        "max_allowed": max_limit
    }
