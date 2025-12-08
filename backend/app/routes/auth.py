from fastapi import APIRouter, Depends, BackgroundTasks
from app.models.user import UserCreate, UserLogin, Token, SendCodeRequest, VerifyCodeRequest
from app.services.auth_service import register_user, login_user
from app.services.send_code import send_verification_code, verify_otp_code
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


@router.post('/send-code')
async def send_code(user: SendCodeRequest, background_tasks: BackgroundTasks):
    """
    Quickly persist OTP and schedule email send in background.
    Returns immediately with queued response.
    """
    result = send_verification_code(user, background_tasks=background_tasks)
    return result


@router.post('/verify-code')
async def verify_otp_code_endpoint(user: VerifyCodeRequest):
    result = await verify_otp_code(user)
    return result
