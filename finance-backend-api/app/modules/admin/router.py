from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin import service
from app.modules.admin.schemas import (
    AdminUserDetail, AdminUserItem, AdminUserList,
    AuditLogList, ResetPasswordRequest, SystemStats,
    CreateUserRequest, SetRoleRequest,
    UserCategoryList, DefaultCategoryTemplateOut,
    DefaultCategoryTemplateCreate, DefaultCategoryTemplateUpdate,
)
from app.modules.auth.models import User
from app.shared.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=SystemStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.get_system_stats(db)


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUserList)
def list_users(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.list_users(db, page=page, page_size=page_size, search=search, is_active=is_active)


@router.post("/users", response_model=AdminUserItem, status_code=201)
def create_user(
    body: CreateUserRequest,
    db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    return service.create_user(db, actor_id=admin.id, email=body.email,
                               password=body.password, full_name=body.full_name)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return service.get_user_detail(db, user_id)


@router.patch("/users/{user_id}/status", response_model=AdminUserItem)
def toggle_status(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return service.toggle_user_status(db, actor_id=admin.id, user_id=user_id)


@router.patch("/users/{user_id}/role", response_model=AdminUserItem)
def set_role(
    user_id: int, body: SetRoleRequest,
    db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    return service.set_user_role(db, actor_id=admin.id, user_id=user_id, is_admin=body.is_admin)


@router.post("/users/{user_id}/reset-password", status_code=204)
def reset_password(
    user_id: int, body: ResetPasswordRequest,
    db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    service.reset_user_password(db, actor_id=admin.id, user_id=user_id, new_password=body.new_password)


# ── Audit logs ─────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=AuditLogList)
def list_audit_logs(
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
    user_id: Optional[int] = Query(None), action: Optional[str] = Query(None),
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.list_audit_logs(db, page=page, page_size=page_size, user_id=user_id, action=action)


# ── User Categories ────────────────────────────────────────────────────────────

@router.get("/user-categories", response_model=UserCategoryList)
def list_user_categories(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None), type: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.list_user_categories(db, page=page, page_size=page_size,
                                        user_id=user_id, type_filter=type,
                                        include_inactive=include_inactive)


@router.delete("/user-categories/{cat_id}", status_code=204)
def deactivate_user_category(
    cat_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    service.deactivate_user_category(db, actor_id=admin.id, cat_id=cat_id)


# ── Default Category Templates ─────────────────────────────────────────────────

@router.get("/default-categories", response_model=list[DefaultCategoryTemplateOut])
def list_default_templates(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.list_default_templates(db, include_inactive=include_inactive)


@router.post("/default-categories", response_model=DefaultCategoryTemplateOut, status_code=201)
def create_default_template(
    body: DefaultCategoryTemplateCreate,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.create_default_template(db, body.model_dump())


@router.patch("/default-categories/{tpl_id}", response_model=DefaultCategoryTemplateOut)
def update_default_template(
    tpl_id: int, body: DefaultCategoryTemplateUpdate,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    return service.update_default_template(db, tpl_id, body.model_dump(exclude_none=True))


@router.delete("/default-categories/{tpl_id}", status_code=204)
def delete_default_template(
    tpl_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    service.delete_default_template(db, tpl_id)
