import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.database import SessionLocal
from app.db.models import User, EmailOTP

client = TestClient(app)

def test_signup_otp_and_verification_workflow():
    test_email = "testotpuser@nitk.ac.in"
    test_password = "SecurePassword123"
    test_name = "OTP Test User"

    # Clean up any leftover test data
    db = SessionLocal()
    try:
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

    # 1. Register new user
    reg_resp = client.post("/api/auth/register", json={
        "full_name": test_name,
        "email": test_email,
        "password": test_password,
        "role": "Researcher"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert reg_data["requires_otp"] is True
    assert reg_data["email"] == test_email

    # 2. Verify user exists in DB and retrieve generated OTP from DB
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        assert user is not None
        assert user.is_verified is False

        otp_record = db.query(EmailOTP).filter(EmailOTP.email == test_email, EmailOTP.is_used == False).first()
        assert otp_record is not None
        otp_code = otp_record.otp_code
        assert len(otp_code) == 6
    finally:
        db.close()

    # 3. Attempt to sign in BEFORE verifying OTP -> must be rejected (HTTP 403)
    login_fail = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_fail.status_code == 403
    assert "not been verified" in login_fail.json()["detail"].lower()

    # 4. Attempt to verify with WRONG code -> must fail (HTTP 400)
    verify_bad = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "000000" if otp_code != "000000" else "111111"
    })
    assert verify_bad.status_code == 400
    assert "invalid" in verify_bad.json()["detail"].lower()

    # 5. Resend OTP rate limit cooldown check (requesting within 30s)
    cooldown_resp = client.post("/api/auth/resend-otp", json={"email": test_email})
    assert cooldown_resp.status_code == 429

    # 6. Verify with CORRECT OTP code -> success, returns access token
    verify_good = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": otp_code
    })
    assert verify_good.status_code == 200
    good_data = verify_good.json()
    assert good_data["success"] is True
    assert "access_token" in good_data
    assert good_data["user"]["email"] == test_email

    # 7. User should now be verified in database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        assert user.is_verified is True
    finally:
        db.close()

    # 8. Sign in AFTER verification -> must succeed
    login_success = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_success.status_code == 200
    assert login_success.json()["success"] is True

    # 9. Clean up
    db = SessionLocal()
    try:
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

def test_expired_otp_rejection():
    test_email = "expiredotp@nitk.ac.in"
    db = SessionLocal()
    try:
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()

        # Create unverified user and an expired OTP
        user = User(
            email=test_email,
            full_name="Expired User",
            hashed_password="hashed_dummy_pw",
            is_verified=False
        )
        db.add(user)
        db.commit()

        past_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=15)
        expired_otp = EmailOTP(
            email=test_email,
            otp_code="987654",
            purpose="SIGNUP",
            created_at=past_time - datetime.timedelta(minutes=10),
            expires_at=past_time,
            is_used=False
        )
        db.add(expired_otp)
        db.commit()
    finally:
        db.close()

    # Verify expired OTP -> must fail with 400
    resp = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "987654"
    })
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()

    # Clean up
    db = SessionLocal()
    try:
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

def test_google_auth_flow():
    test_google_email = "googleuser@nitk.ac.in"
    test_google_name = "Google Test User"

    # Clean up
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_google_email).delete()
        db.commit()
    finally:
        db.close()

    # 1. Sign in with Google
    resp = client.post("/api/auth/google", json={
        "email": test_google_email,
        "full_name": test_google_name,
        "role": "Researcher"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == test_google_email
    assert data["user"]["full_name"] == test_google_name

    # 2. Verify account is immediately verified
    token = data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_google_email

    # Clean up
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_google_email).delete()
        db.commit()
    finally:
        db.close()

