import datetime
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import engine, Base, SessionLocal
from app.db.models import User, SystemConfig
from app.api.auth import router as auth_router
from app.api.convert import router as convert_router
from app.api.history import router as history_router
from app.api.admin import router as admin_router
from app.api.samples import router as samples_router

from sqlalchemy import text

# Initialize database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[STARTUP ERROR] Database tables init failed: {e}")

# Safe SQLite migration for newly added columns
def run_migrations():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            col_names = [row[1] for row in result]
            if "is_verified" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1"))
                conn.commit()
    except Exception as e:
        print(f"[MIGRATION NOTICE] {e}")

try:
    run_migrations()
except Exception as e:
    print(f"[MIGRATION ERROR] {e}")

# Seed initial admin & student accounts
def seed_initial_data():
    try:
        db = SessionLocal()
        try:
            # Seed Admin user if not present
            admin = db.query(User).filter(User.email == "admin@nitk.ac.in").first()
            if not admin:
                admin = User(
                    email="admin@nitk.ac.in",
                    full_name="NITK Administrator",
                    hashed_password=get_password_hash("Admin@123"),
                    is_active=True,
                    is_admin=True,
                    is_verified=True,
                    role="Administrator"
                )
                db.add(admin)
            else:
                if not getattr(admin, "is_verified", True):
                    admin.is_verified = True

            # Seed Student user (Aditya Raj)
            student = db.query(User).filter(User.email == "aditya@nitk.ac.in").first()
            if not student:
                student = User(
                    email="aditya@nitk.ac.in",
                    full_name="Aditya Raj",
                    hashed_password=get_password_hash("Aditya@123"),
                    is_active=True,
                    is_admin=False,
                    is_verified=True,
                    role="Student"
                )
                db.add(student)
            else:
                if not getattr(student, "is_verified", True):
                    student.is_verified = True

            # Seed initial system configuration
            if not db.query(SystemConfig).filter(SystemConfig.key == "max_upload_size_mb").first():
                db.add(SystemConfig(key="max_upload_size_mb", value="50", description="Maximum file upload size in MB"))
            if not db.query(SystemConfig).filter(SystemConfig.key == "nominal_threshold").first():
                db.add(SystemConfig(key="nominal_threshold", value="20", description="Nominal attribute inference distinct value limit"))

            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"[SEEDING ERROR] {e}")

try:
    seed_initial_data()
except Exception as e:
    print(f"[SEEDING ERROR] {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Bidirectional CSV <-> ARFF File Converter System conforming to WEKA 3.8+ and RFC 4180 specifications."
)

# Global exception handler — logs stack traces and respects HTTPException
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    from starlette.exceptions import HTTPException as StarletteHTTPException
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None)
        )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again or contact the administrator.",
            "error_type": type(exc).__name__,
            "message": str(exc)
        }
    )

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under both /api and root / (ensures Vercel rewrite compatibility)
for prefix in [settings.API_V1_STR, ""]:
    app.include_router(auth_router, prefix=prefix)
    app.include_router(convert_router, prefix=prefix)
    app.include_router(history_router, prefix=prefix)
    app.include_router(admin_router, prefix=prefix)
    app.include_router(samples_router, prefix=prefix)

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

