from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from app.models.user import UserCreate, UserLogin, Token, SendCodeRequest, VerifyCodeRequest, SignupRequest, CheckEmailRequest, RefreshTokenRequest, UpdatePasswordRequest
from app.services.auth_service import register_user, login_user, signup_user, check_email_exists, check_company_email_exists

from app.services.send_code import send_verification_code, verify_otp_code
from app.services.update_password import update_password
from app.utils.deps import get_current_user
from app.utils.security import verify_token, create_access_token

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


@router.post('/check-email')
async def check_email(request: CheckEmailRequest):
    """
    Check if email already exists in the database.
    Returns exists: true/false
    """
    return await check_email_exists(request.email)


@router.post('/check-company-email')
async def check_company_email(request: CheckEmailRequest):
    """
    Check if company email already exists in the database.
    Returns exists: true/false
    """
    return await check_company_email_exists(request.email)


@router.post('/signup')
async def signup(signup_data: SignupRequest, background_tasks: BackgroundTasks):
    """
    Complete user signup with company or individual details.
    Creates user with temporary password, role, and type.
    """
    return await signup_user(signup_data, background_tasks)


@router.post('/update-password')
async def update__password(password_data: UpdatePasswordRequest):
    return await update_password(password_data)


@router.post('/refresh', response_model=Token)
async def refresh_token(request: RefreshTokenRequest):
    """
    Generate new access token from refresh token.
    """
    try:
        # Verify refresh token
        payload = verify_token(request.refresh_token, token_type="refresh")

        # Create new access token with same user data
        token_data = {"sub": payload["sub"], "email": payload["email"]}
        new_access_token = create_access_token(token_data)

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
