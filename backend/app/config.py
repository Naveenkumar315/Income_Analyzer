# app/config.py
from pydantic_settings import BaseSettings  # instead of pydantic


class Settings(BaseSettings):
    db_url: str
    db_name: str
    jwt_secret: str
    jwt_algorithm: str
    jwt_expire_minutes: int

    email_user: str
    email_pass: str
    smtp_server: str = "smtp.office365.com"
    smtp_port: int = 587
    tenant_id: str
    sso_reply_url: str

    class Config:
        env_file = ".env"


settings = Settings()
