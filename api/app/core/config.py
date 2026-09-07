import os

def _is_serverless_env() -> bool:
    return bool(
        os.getenv("VERCEL") or 
        os.getenv("VERCEL_ENV") or
        os.getenv("AWS_LAMBDA_FUNCTION_NAME") or 
        os.getenv("LAMBDA_TASK_ROOT") or
        os.getenv("NOW_REGION")
    )

def _resolve_database_url() -> str:
    env_db = os.getenv("DATABASE_URL")
    if env_db:
        return env_db
    if _is_serverless_env():
        return "sqlite:////tmp/file_converter.db"
    try:
        # Check if local directory is writable (not a read-only container)
        test_file = os.path.join(os.getcwd(), ".perm_probe_tmp")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        return "sqlite:///./file_converter.db"
    except Exception:
        return "sqlite:////tmp/file_converter.db"

def _resolve_stage_dir() -> str:
    env_stage = os.getenv("STAGE_DIR")
    if env_stage:
        return env_stage
    if _is_serverless_env():
        return "/tmp/staging"
    try:
        os.makedirs("./staging", exist_ok=True)
        return "./staging"
    except Exception:
        return "/tmp/staging"

class Settings:
    PROJECT_NAME: str = "File Converter System (CSV <-> ARFF)"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nitk-arff-csv-secret-key-2026-super-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = _resolve_database_url()
    
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    DEFAULT_NOMINAL_THRESHOLD: int = int(os.getenv("DEFAULT_NOMINAL_THRESHOLD", "20"))
    
    STAGE_DIR: str = _resolve_stage_dir()
    ALLOWED_EXTENSIONS: set = {".csv", ".arff", ".txt", ".data"}

    # SMTP & Email Verification Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@fileconverter.org")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "File Converter System")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))

settings = Settings()
try:
    os.makedirs(settings.STAGE_DIR, exist_ok=True)
except Exception:
    pass

