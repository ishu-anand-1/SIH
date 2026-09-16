import os

db_url = os.getenv("DATABASE_URL")
if not db_url or "postgresql" in db_url:
    # Default to sqlite for local dev unless explicitly running in postgres container
    db_url = "sqlite:///./metrologyx.db"

class Settings:
    PROJECT_NAME: str = "METROLOGYX API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "metrologyx-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    DATABASE_URL: str = db_url

    # AI Vision
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_VISION_MODEL: str = os.getenv(
        "GROQ_VISION_MODEL",
        "qwen/qwen3.8-27b"
    )

settings = Settings()

