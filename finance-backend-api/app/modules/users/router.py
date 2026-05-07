from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.auth.schemas import UserOut, ChangePasswordRequest, MessageResponse
from app.modules.auth import service as auth_service
from app.core.exceptions import BadRequestError

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone_number: str | None = Field(default=None, min_length=1, max_length=20)
    avatar_url: str | None = Field(default=None)


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return auth_service.update_profile(
        db=db,
        user=current_user,
        full_name=body.full_name,
        phone_number=body.phone_number,
        avatar_url=body.avatar_url,
    )


@router.post("/me/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.new_password != body.confirm_password:
        raise BadRequestError("Mật khẩu mới và xác nhận mật khẩu không khớp")
    auth_service.change_password(db, current_user, body.current_password, body.new_password)
    return MessageResponse(message="Đổi mật khẩu thành công. Vui lòng đăng nhập lại.")
