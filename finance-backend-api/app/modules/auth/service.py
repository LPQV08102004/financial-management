from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from jose import JWTError

from app.core.exceptions import ConflictError, UnauthorizedError, BadRequestError
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.modules.auth.models import User, RefreshToken
from app.modules.categories.service import seed_default_categories
from app.modules.accounts.service import create_account


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, email: str, password: str, full_name: str) -> User:
    existing = get_user_by_email(db, email)
    if existing:
        raise ConflictError("Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    seed_default_categories(db, user.id)
    create_account(db, user.id, {"name": "Tiền mặt", "type": "cash", "currency": "VND"})

    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("User is inactive")
    if not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    return user


def create_tokens_for_user(db: Session, user: User) -> tuple[str, str]:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False,
    )
    db.add(refresh_record)
    db.commit()
    return access_token, refresh_token


def rotate_refresh_token(db: Session, refresh_token: str) -> tuple[User, str, str]:
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise UnauthorizedError("Invalid refresh token")

    token_type = payload.get("type")
    if token_type != "refresh":
        raise UnauthorizedError("Invalid token type")

    sub = payload.get("sub")
    if sub is None:
        raise UnauthorizedError("Invalid refresh token")

    token_row = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == refresh_token, RefreshToken.is_revoked == False)
        .first()
    )
    if not token_row:
        raise UnauthorizedError("Refresh token not found or revoked")

    if token_row.expires_at < datetime.utcnow():
        raise UnauthorizedError("Refresh token expired")

    user = get_user_by_id(db, int(sub))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    token_row.is_revoked = True
    access_token, new_refresh_token = create_tokens_for_user(db, user)
    return user, access_token, new_refresh_token


def update_profile(
    db: Session,
    user: User,
    full_name: str | None,
    current_password: str | None,
    new_password: str | None,
) -> User:
    if full_name is not None:
        user.full_name = full_name

    if new_password is not None:
        if not current_password:
            raise BadRequestError("current_password is required to set new_password")
        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedError("Current password is incorrect")
        user.hashed_password = hash_password(new_password)

    db.commit()
    db.refresh(user)
    return user
