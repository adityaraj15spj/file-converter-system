import datetime
import secrets
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, EmailOTP
from app.core.config import settings
from app.core.email import send_otp_email
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "Student"

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class ResendOtpRequest(BaseModel):
    email: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserProfileUpdateRequest(BaseModel):
    full_name: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PasswordResetSimRequest(BaseModel):
    email: str

@router.post("/register", status_code=status.HTTP_200_OK)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    
    # Password strength check (at least 6 chars)
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check existing email
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in."
            )
        else:
            # User exists but hasn't verified yet; update registration info
            existing.full_name = payload.full_name
            existing.hashed_password = get_password_hash(payload.password)
            existing.role = payload.role or "Student"
            user_record = existing
    else:
        user_record = User(
            email=email_clean,
            full_name=payload.full_name,
            hashed_password=get_password_hash(payload.password),
            role=payload.role or "Student",
            is_active=True,
            is_admin=False,
            is_verified=False
        )
        db.add(user_record)

    db.commit()
    db.refresh(user_record)

    # Invalidate older unused OTPs for this email
    db.query(EmailOTP).filter(EmailOTP.email == email_clean, EmailOTP.is_used == False).update({"is_used": True})

    # Generate 6-digit numeric OTP code
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    now = datetime.datetime.now(datetime.timezone.utc)
    expires = now + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp_record = EmailOTP(
        email=email_clean,
        otp_code=otp_code,
        purpose="SIGNUP",
        created_at=now,
        expires_at=expires,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    # Send verification email via SMTP directly to user
    email_res = send_otp_email(to_email=email_clean, full_name=payload.full_name, otp_code=otp_code, purpose="Signup Verification")
    if not email_res.get("sent"):
        logger.warning(f"[REGISTRATION] Email dispatch notice: {email_res.get('message')}")

    return {
        "success": True,
        "requires_otp": True,
        "email": email_clean,
        "message": f"A 6-digit verification code has been dispatched directly to {email_clean}. Please check your email inbox and spam folder to activate your account."
    }

@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    otp_clean = payload.otp.strip()

    otp_record = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email_clean, EmailOTP.is_used == False)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification code found. Please request a new code."
        )

    # Timezone-aware expiry check
    now = datetime.datetime.now(datetime.timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)

    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new one."
        )

    if otp_record.otp_code != otp_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your email and try again."
        )

    # Valid OTP
    otp_record.is_used = True
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account record was not found."
        )

    user.is_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, is_admin=user.is_admin)
    return {
        "success": True,
        "message": "Email verified successfully! Welcome to your workspace.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_admin": user.is_admin
        }
    }

@router.post("/resend-otp")
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registration found for this email."
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified. Please sign in."
        )

    # 30-second cooldown check
    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email_clean)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )
    now = datetime.datetime.now(datetime.timezone.utc)
    if latest_otp and latest_otp.created_at:
        created_at = latest_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=datetime.timezone.utc)
        if (now - created_at).total_seconds() < 30:
            remaining = int(30 - (now - created_at).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting another code."
            )

    # Invalidate older unused OTPs
    db.query(EmailOTP).filter(EmailOTP.email == email_clean, EmailOTP.is_used == False).update({"is_used": True})

    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires = now + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp_record = EmailOTP(
        email=email_clean,
        otp_code=otp_code,
        purpose="SIGNUP",
        created_at=now,
        expires_at=expires,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    email_res = send_otp_email(to_email=email_clean, full_name=user.full_name, otp_code=otp_code, purpose="Signup Verification")
    if not email_res.get("sent"):
        logger.warning(f"[RESEND OTP] Email dispatch notice: {email_res.get('message')}")

    return {
        "success": True,
        "message": f"A new verification code has been dispatched directly to {email_clean}. Please check your email inbox and spam folder."
    }

@router.post("/login")
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email has not been verified yet. Please enter the verification code sent to your email."
        )

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.last_login = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    token = create_access_token(subject=user.id, is_admin=user.is_admin)
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_admin": user.is_admin
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }

@router.put("/profile")
def update_profile(payload: UserProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.full_name = payload.full_name
    db.commit()
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "is_admin": current_user.is_admin
        }
    }

@router.post("/change-password")
def change_password(payload: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully."}

@router.delete("/delete-account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"success": True, "message": "Account and associated conversion history deleted successfully."}

@router.post("/forgot-password")
def forgot_password_simulate(payload: PasswordResetSimRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # To prevent user enumeration in production, we return success even if email is not found
    return {
        "success": True,
        "message": f"If an account exists for {payload.email}, a password reset verification link has been dispatched (SMTP Simulated per SI-003)."
    }
