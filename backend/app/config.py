# app/config.py
from pydantic_settings import BaseSettings  # instead of pydantic


class Settings(BaseSettings):
    db_url: str
    db_name: str
    jwt_secret: str
    jwt_algorithm: str
    jwt_expire_minutes: int

    class Config:
        env_file = ".env"

settings = Settings()
