from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from app.config import settings

# Use a stable, widely used algorithm without the 72-byte issue
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    # No need to manually truncate or convert to bytes;
    # Passlib handles encoding internally.
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {**data, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def create_refresh_token(data: dict) -> str:
    """Create refresh token with 7 days expiration"""
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {**data, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def verify_token(token: str, token_type: str = "access") -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != token_type:
            raise ValueError(f"Invalid token type. Expected {token_type}")
        return payload
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")

