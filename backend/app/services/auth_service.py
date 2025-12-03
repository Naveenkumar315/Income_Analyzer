from app.db import db
from app.utils.security import hash_password, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin
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
    return {"access_token": token, "token_type": "bearer", "username": db_user["username"], "email": db_user["email"]}
