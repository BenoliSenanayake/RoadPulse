import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    ROBOFLOW_API_KEY: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
