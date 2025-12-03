# app/routes/user.py
from fastapi import APIRouter
from app.db import db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def get_users():
    users = await db["users"].find().to_list(100)
    return users
