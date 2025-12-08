from app.db import db
from app.utils.security import hash_password, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin, SignupRequest
from datetime import datetime
from fastapi import HTTPException


async def register_user(user: UserCreate):
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
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token(
        {"sub": str(db_user["_id"]), "email": db_user["email"]})
    return {"access_token": token, "token_type": "bearer", "username": db_user.get("username", ""), "email": db_user["email"]}


async def signup_user(signup_data: SignupRequest):
    """
    Handle user signup with company or individual details.
    Creates user with temporary password Test@123, role as 'user', and nested data structure.
    """
    # Check if user already exists
    existing = await db["users"].find_one({"email": signup_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash temporary password
    temp_password = "Test@123"
    hashed_password = hash_password(temp_password)
    
    now = datetime.utcnow()

    # Build user document based on type
    user_document = {
        "email": signup_data.email,
        "password": hashed_password,
        "role": "user",
        "type": signup_data.type,
        "created_at": now,
        "updated_at": now,
    }

    # Add nested data based on type
    if signup_data.type == "company":
        if signup_data.companyInfo:
            user_document["companyInfo"] = signup_data.companyInfo.dict()
        if signup_data.companyAddress:
            user_document["companyAddress"] = signup_data.companyAddress.dict()
        if signup_data.primaryContact:
            user_document["primaryContact"] = signup_data.primaryContact.dict()
    elif signup_data.type == "individual":
        if signup_data.individualInfo:
            user_document["individualInfo"] = signup_data.individualInfo.dict()

    # Insert into users collection
    result = await db["users"].insert_one(user_document)
    
    return {
        "message": "User registered successfully",
        "email": signup_data.email,
        "type": signup_data.type,
        "role": "user"
    }
