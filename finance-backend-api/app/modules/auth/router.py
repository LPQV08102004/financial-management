from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    LogoutRequest,
    MessageResponse,
    UserOut,
)
from app.modules.auth import service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    print(f"[ENDPOINT] register() called with email={body.email}")
    try:
        print(f"[ENDPOINT] calling service.register_user...")
        user = service.register_user(db, body.email, body.password, body.full_name, body.phone_number)
        print(f"[ENDPOINT] user created: {user.id}")
        access_token, refresh_token = service.create_tokens_for_user(db, user)
        print(f"[ENDPOINT] tokens created")
        background_tasks.add_task(service.bootstrap_new_user_data, user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user),
        )
    except Exception as e:
        import traceback
        print(f"[ENDPOINT_ERROR] {str(e)}")
        traceback.print_exc()
        raise

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = service.authenticate_user(db, body.email, body.password)
    access_token, refresh_token = service.create_tokens_for_user(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    user, access_token, refresh_token = service.rotate_refresh_token(db, body.refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )

@router.post("/logout", response_model=MessageResponse)
def logout(body: LogoutRequest, db: Session = Depends(get_db)):
    service.logout_user(db, body.refresh_token)
    return MessageResponse(message="Đăng xuất thành công")

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
