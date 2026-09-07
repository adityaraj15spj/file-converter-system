import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from .database import Base

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    role = Column(String(50), default="Student")
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    last_login = Column(DateTime, nullable=True)

    conversions = relationship("ConversionHistory", back_populates="owner", cascade="all, delete-orphan")

class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), default="SIGNUP")
    created_at = Column(DateTime, default=get_utc_now)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

class ConversionHistory(Base):
    __tablename__ = "conversion_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    source_format = Column(String(20), nullable=False)
    target_format = Column(String(20), nullable=False)
    instance_count = Column(Integer, default=0)
    attribute_count = Column(Integer, default=0)
    status = Column(String(50), default="SUCCESS")
    duration_ms = Column(Float, default=0.0)
    converted_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)

    owner = relationship("User", back_populates="conversions")

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
