from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.config import settings
from app.services import auth_service
from app.schemas.user import UserCreate, UserResponse, Token
from app.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.models.user import User

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    user = await auth_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = await auth_service.create_user(db, user_in)
    return user

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = await auth_service.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user

@router.post("/forgot-password", status_code=200)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Trigger password reset email.
    Always returns 200 to prevent email enumeration.
    """
    print(f"DEBUG: Received forgot password request for {request.email}", flush=True)
    await auth_service.request_password_reset(db, request.email)
    return {"message": "If the email exists, a reset link has been sent."}

@router.post("/reset-password", status_code=200)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Reset password using token.
    """
    success, message = await auth_service.reset_password(
        db, request.token, request.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"message": "Password updated successfully"}
