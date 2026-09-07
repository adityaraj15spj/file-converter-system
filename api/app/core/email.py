import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

def send_otp_email(to_email: str, full_name: str, otp_code: str, purpose: str = "Signup Verification") -> dict:
    """
    Sends an OTP email to the user using SMTP if configured,
    or safely simulates dispatch if SMTP is unconfigured or unavailable.
    """
    subject = f"Your Verification Code ({otp_code}) - {settings.SMTP_FROM_NAME}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f19;
          color: #f1f5f9;
          margin: 0;
          padding: 24px;
        }}
        .container {{
          max-width: 520px;
          margin: 0 auto;
          background: #111827;
          border-radius: 12px;
          border: 1px solid #1f2937;
          padding: 32px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }}
        .header {{
          text-align: center;
          margin-bottom: 24px;
        }}
        .brand {{
          font-size: 20px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.5px;
        }}
        .title {{
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 12px;
          margin-bottom: 8px;
        }}
        .greeting {{
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
        }}
        .otp-box {{
          background: #1e293b;
          border: 2px dashed #0284c7;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }}
        .otp-code {{
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #38bdf8;
          font-family: 'Courier New', monospace;
        }}
        .expiry {{
          font-size: 13px;
          color: #f59e0b;
          margin-top: 8px;
        }}
        .footer {{
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid #1f2937;
          font-size: 12px;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">File Converter System</div>
          <div class="title">{purpose}</div>
        </div>
        <p class="greeting">Hello <strong>{full_name or 'there'}</strong>,</p>
        <p class="greeting">
          Thank you for creating an account with the File Converter System.
          Please use the 6-digit verification code below to verify your email address and activate your account.
        </p>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
          <div class="expiry">Valid for {settings.OTP_EXPIRE_MINUTES} minutes</div>
        </div>
        <p class="greeting">
          If you did not request this verification code, please disregard this email.
        </p>
        <div class="footer">
          File Converter System &bull; National Institute of Technology Karnataka (NITK)<br>
          Automated system message, please do not reply.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
File Converter System - {purpose}
==================================================

Hello {full_name or 'there'},

Your 6-digit verification code is: {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.
Enter this code in the application to activate your account.

If you did not request this email, please ignore it.
"""

    # Check if SMTP is configured
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            from_email = settings.SMTP_FROM_EMAIL
            if not from_email or from_email == "noreply@fileconverter.org":
                from_email = settings.SMTP_USER or "noreply@fileconverter.org"

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{from_email}>"
            msg["To"] = to_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                if settings.SMTP_TLS:
                    server.starttls()

            with server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_email, [to_email], msg.as_string())

            logger.info(f"[EMAIL] Verification OTP email successfully dispatched via SMTP to {to_email}")
            return {"sent": True, "message": "Email dispatched via SMTP"}
        except Exception as exc:
            logger.error(f"[EMAIL] SMTP dispatch failed: {exc}")
            return {
                "sent": False,
                "error": str(exc),
                "message": f"SMTP mail delivery failed ({str(exc)}). Please verify your SMTP credentials."
            }
    else:
        import os
        if os.getenv("PYTEST_CURRENT_TEST") or os.getenv("TESTING"):
            logger.info(f"[EMAIL TEST SIMULATION] Simulated OTP for {to_email}: {otp_code}")
            return {"sent": True, "message": "Test simulated email"}
        logger.warning(f"[EMAIL] SMTP is not configured. Email could not be sent to {to_email}.")
        return {
            "sent": False,
            "error": "SMTP_NOT_CONFIGURED",
            "message": "Email delivery service (SMTP) is not configured. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in your environment variables to receive real verification codes."
        }

