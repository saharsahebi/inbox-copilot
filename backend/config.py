import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "api_key")
    EMAIL_ADDRESS: str = os.getenv("EMAIL_ADDRESS", "your_email")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "your_password")
    MODEL_NAME: str = "openai/gpt-oss-120b"

settings = Settings()