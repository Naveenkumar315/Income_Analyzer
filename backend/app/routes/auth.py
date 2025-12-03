from fastapi import APIRouter, Depends
from app.models.user import UserCreate, UserLogin, Token
from app.services.auth_service import register_user, login_user
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(user: UserCreate):
    return await register_user(user)


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    return await login_user(user)

# Alias for Swagger OAuth2PasswordBearer flow


@router.post("/token", response_model=Token, include_in_schema=False)
async def login_token(user: UserLogin):
    return await login_user(user)


@router.get("/me")
async def read_me(current_user: dict = Depends(get_current_user)):
    return current_user
