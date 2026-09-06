import datetime
from fastapi import FastAPI
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

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed initial admin & student accounts
def seed_initial_data():
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
                role="Administrator"
            )
            db.add(admin)

        # Seed Student user (Aditya Raj)
        student = db.query(User).filter(User.email == "aditya@nitk.ac.in").first()
        if not student:
            student = User(
                email="aditya@nitk.ac.in",
                full_name="Aditya Raj",
                hashed_password=get_password_hash("Aditya@123"),
                is_active=True,
                is_admin=False,
                role="Student"
            )
            db.add(student)

        # Seed initial system configuration
        if not db.query(SystemConfig).filter(SystemConfig.key == "max_upload_size_mb").first():
            db.add(SystemConfig(key="max_upload_size_mb", value="50", description="Maximum file upload size in MB"))
        if not db.query(SystemConfig).filter(SystemConfig.key == "nominal_threshold").first():
            db.add(SystemConfig(key="nominal_threshold", value="20", description="Nominal attribute inference distinct value limit"))

        db.commit()
    finally:
        db.close()

seed_initial_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Bidirectional CSV <-> ARFF File Converter System conforming to WEKA 3.8+ and RFC 4180 specifications."
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(convert_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(samples_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
