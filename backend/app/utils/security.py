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
    payload = {**data, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
