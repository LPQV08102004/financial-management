from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.shared.enums import AuditAction, CategoryType


# ── User schemas ───────────────────────────────────────────────────────────────

class AdminUserItem(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserList(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AdminUserItem]


class AdminUserDetail(AdminUserItem):
    total_transactions: int
    total_accounts: int


class ResetPasswordRequest(BaseModel):
    new_password: str


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class SetRoleRequest(BaseModel):
    is_admin: bool


# ── Stats schemas ──────────────────────────────────────────────────────────────

class SystemStats(BaseModel):
    total_users: int
    active_users: int
    new_users_this_month: int
    total_transactions: int
    transactions_this_month: int
    total_accounts: int
    total_categories: int


# ── Audit Log schemas ──────────────────────────────────────────────────────────

class AuditLogItem(BaseModel):
    id: int
    user_id: int
    action: AuditAction
    entity_type: str
    entity_id: int
    before_data: Optional[str]
    after_data: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogList(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AuditLogItem]


# ── User Category schemas ──────────────────────────────────────────────────────

class UserCategoryItem(BaseModel):
    id: int
    user_id: int
    user_email: str
    user_full_name: str
    name: str
    type: CategoryType
    color: Optional[str]
    icon: Optional[str]
    is_active: bool
    created_at: datetime


class UserCategoryList(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[UserCategoryItem]


# ── Default Category Template schemas ─────────────────────────────────────────

class DefaultCategoryTemplateOut(BaseModel):
    id: int
    group_name: str
    group_sort_order: int
    name: str
    type: CategoryType
    color: Optional[str]
    icon: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DefaultCategoryTemplateCreate(BaseModel):
    group_name: str
    group_sort_order: int = 0
    name: str
    type: CategoryType
    color: Optional[str] = None
    icon: Optional[str] = None


class DefaultCategoryTemplateUpdate(BaseModel):
    group_name: Optional[str] = None
    group_sort_order: Optional[int] = None
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
