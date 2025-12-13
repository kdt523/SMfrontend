import logging
import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings

# Use uvicorn's logger to ensure visibility in the console
logger = logging.getLogger("uvicorn")

class EmailService:
    @staticmethod
    async def send_reset_password_email(email: str, token: str):
        """
        Sends a password reset email using SMTP.
        """
        # Use localhost for local development
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        
        # Log using warning level to ensure it shows up in the console (Fallback/Debug)
        logger.warning(f"========================================================")
        logger.warning(f"EMAIL TO: {email}")
        logger.warning(f"SUBJECT: Password Reset Request")
        logger.warning(f"BODY: Click here to reset your password: {reset_link}")
        logger.warning(f"========================================================")
        
        # Construct the email
        message = EmailMessage()
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = email
        message["Subject"] = "Password Reset Request - StockMaster"
        
        body = f"""
        Hello,

        You have requested to reset your password.
        Please click the link below to set a new password:

        {reset_link}

        If you did not request this, please ignore this email.
        
        This link will expire in 15 minutes.
        """
        message.set_content(body)

        try:
            # Only attempt to send if configuration is not default/placeholder
            if "your-email" in settings.SMTP_USER or "your-app-password" in settings.SMTP_PASSWORD:
                logger.warning("SMTP not configured. Skipping actual email send.")
                return True

            # Determine TLS/STARTTLS settings based on port
            use_tls = settings.SMTP_TLS
            start_tls = False
            
            # Common convention: Port 465 is implicit SSL/TLS, Port 587 is STARTTLS
            if settings.SMTP_PORT == 587:
                use_tls = False
                start_tls = True

            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=use_tls,
                start_tls=start_tls,
            )
            logger.info(f"Password reset email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}")
            # We return True anyway to not block the user flow (and avoid enumeration if we wanted to be strict, 
            # though here we are already inside the 'user exists' block in auth_service)
            return False
