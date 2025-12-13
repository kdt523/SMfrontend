from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.user import User, PasswordResetToken
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.services.email_service import EmailService
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate):
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

import logging

logger = logging.getLogger("uvicorn")

async def request_password_reset(db: AsyncSession, email: str):
    logger.warning(f"DEBUG: Processing password reset for {email}")
    # 1. Check if user exists
    user = await get_user_by_email(db, email)
    if not user:
        logger.warning(f"DEBUG: Password reset requested for non-existent email: {email}")
        # Return True to avoid email enumeration
        return True

    # 2. Generate secure token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    
    # 3. Save to DB
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_token)
    await db.commit()

    # 4. Send Email
    await EmailService.send_reset_password_email(email, raw_token)
    return True

async def reset_password(db: AsyncSession, token: str, new_password: str):
    # 1. Hash the received token
    token_hash = hash_token(token)

    # 2. Find token in DB
    result = await db.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
    )
    db_token = result.scalars().first()

    # 3. Validate token
    if not db_token:
        return False, "Invalid token"
    
    if db_token.is_used:
        return False, "Token already used"
    
    if db_token.expires_at < datetime.now(timezone.utc):
        return False, "Token expired"

    # 4. Get User
    result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = result.scalars().first()
    if not user:
        return False, "User not found"

    # 5. Update Password
    user.password_hash = get_password_hash(new_password)
    
    # 6. Mark token as used
    db_token.is_used = True
    
    # 7. Invalidate all other tokens for this user (Optional but good practice)
    # We can delete them or mark them used. Let's delete old ones to keep DB clean.
    await db.execute(
        delete(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id)
        .where(PasswordResetToken.id != db_token.id)
    )

    await db.commit()
    return True, "Password updated successfully"

