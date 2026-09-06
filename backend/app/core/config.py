import os

class Settings:
    PROJECT_NAME: str = "File Converter System (CSV <-> ARFF)"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nitk-arff-csv-secret-key-2026-super-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./file_converter.db")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    DEFAULT_NOMINAL_THRESHOLD: int = int(os.getenv("DEFAULT_NOMINAL_THRESHOLD", "20"))
    STAGE_DIR: str = "./staging"

settings = Settings()
os.makedirs(settings.STAGE_DIR, exist_ok=True)
