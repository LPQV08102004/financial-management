import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, BadRequestError, ConflictError
from app.core.security import hash_password
from app.modules.accounts.models import Account
from app.modules.admin.models import DefaultCategoryTemplate
from app.modules.budgets.models import AuditLog
from app.modules.admin.schemas import (
    AdminUserDetail, AdminUserItem, AdminUserList,
    AuditLogItem, AuditLogList, SystemStats,
    UserCategoryItem, UserCategoryList,
    DefaultCategoryTemplateOut,
)
from app.modules.auth.models import User
from app.modules.categories.models import Category
from app.modules.transactions.models import Transaction
from app.shared.enums import AuditAction, CategoryType

def _write_audit(db, actor_id, action, entity_type, entity_id, before=None, after=None):
    db.add(AuditLog(
        user_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_data=json.dumps(before, default=str) if before else None,
        after_data=json.dumps(after, default=str) if after else None,
    ))

def list_users(db, page=1, page_size=20, search=None, is_active=None):
    q = db.query(User)
    if search:
        q = q.filter((User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%")))
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    total = q.count()
    users = q.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AdminUserList(total=total, page=page, page_size=page_size,
                         items=[AdminUserItem.model_validate(u) for u in users])

def get_user_detail(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    tx = db.query(func.count(Transaction.id)).filter(Transaction.user_id == user_id).scalar()
    acc = db.query(func.count(Account.id)).filter(Account.user_id == user_id).scalar()
    return AdminUserDetail(**AdminUserItem.model_validate(user).model_dump(),
                           total_transactions=tx or 0, total_accounts=acc or 0)

def create_user(db, actor_id, email, password, full_name):
    from app.modules.auth.service import register_user
    if len(password) < 8:
        raise BadRequestError("Password must be at least 8 characters")
    user = register_user(db, email, password, full_name)
    _write_audit(db, actor_id, AuditAction.admin_toggle_user_status, "user", user.id,
                 after={"action": "created", "email": email})
    db.commit()
    return AdminUserItem.model_validate(user)

def toggle_user_status(db, actor_id, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    if user.is_admin:
        raise BadRequestError("Cannot deactivate an admin account")
    before = {"is_active": user.is_active}
    user.is_active = not user.is_active
    _write_audit(db, actor_id, AuditAction.admin_toggle_user_status, "user", user_id,
                 before, {"is_active": user.is_active})
    db.commit()
    db.refresh(user)
    return AdminUserItem.model_validate(user)

def set_user_role(db, actor_id, user_id, is_admin):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    if actor_id == user_id and not is_admin:
        raise BadRequestError("Cannot remove your own admin role")
    before = {"is_admin": user.is_admin}
    user.is_admin = is_admin
    _write_audit(db, actor_id, AuditAction.admin_toggle_user_status, "user", user_id,
                 before, {"is_admin": is_admin})
    db.commit()
    db.refresh(user)
    return AdminUserItem.model_validate(user)

def reset_user_password(db, actor_id, user_id, new_password):
    if len(new_password) < 8:
        raise BadRequestError("Password must be at least 8 characters")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    user.hashed_password = hash_password(new_password)
    _write_audit(db, actor_id, AuditAction.admin_reset_password, "user", user_id)
    db.commit()

def get_system_stats(db):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return SystemStats(
        total_users=db.query(func.count(User.id)).scalar() or 0,
        active_users=db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0,
        new_users_this_month=db.query(func.count(User.id)).filter(User.created_at >= month_start).scalar() or 0,
        total_transactions=db.query(func.count(Transaction.id)).scalar() or 0,
        transactions_this_month=db.query(func.count(Transaction.id)).filter(Transaction.created_at >= month_start).scalar() or 0,
        total_accounts=db.query(func.count(Account.id)).scalar() or 0,
        total_categories=db.query(func.count(Category.id)).scalar() or 0,
    )

def list_audit_logs(db, page=1, page_size=50, user_id=None, action=None):
    q = db.query(AuditLog)
    if user_id is not None:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action == action)
    total = q.count()
    logs = q.order_by(AuditLog.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AuditLogList(total=total, page=page, page_size=page_size,
                        items=[AuditLogItem.model_validate(l) for l in logs])

def list_user_categories(db, page=1, page_size=20, user_id=None, type_filter=None, include_inactive=False):
    q = db.query(Category, User).join(User, Category.user_id == User.id)
    if not include_inactive:
        q = q.filter(Category.is_active == True)
    if user_id:
        q = q.filter(Category.user_id == user_id)
    if type_filter:
        q = q.filter(Category.type == type_filter)
    total = q.count()
    rows = q.order_by(Category.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [UserCategoryItem(
        id=cat.id, user_id=cat.user_id, user_email=user.email,
        user_full_name=user.full_name, name=cat.name, type=cat.type,
        color=cat.color, icon=cat.icon, is_active=cat.is_active, created_at=cat.created_at,
    ) for cat, user in rows]
    return UserCategoryList(total=total, page=page, page_size=page_size, items=items)

def deactivate_user_category(db, actor_id, cat_id):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    cat.is_active = False
    _write_audit(db, actor_id, AuditAction.admin_toggle_user_status, "category", cat_id,
                 before={"is_active": True}, after={"is_active": False})
    db.commit()

def list_default_templates(db, include_inactive=False):
    q = db.query(DefaultCategoryTemplate)
    if not include_inactive:
        q = q.filter(DefaultCategoryTemplate.is_active == True)
    return q.order_by(DefaultCategoryTemplate.group_sort_order, DefaultCategoryTemplate.id).all()

def create_default_template(db, data: dict):
    tpl = DefaultCategoryTemplate(**data, is_active=True)
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl

def update_default_template(db, tpl_id, data: dict):
    tpl = db.query(DefaultCategoryTemplate).filter(DefaultCategoryTemplate.id == tpl_id).first()
    if not tpl:
        raise NotFoundError("Template not found")
    for k, v in data.items():
        if v is not None:
            setattr(tpl, k, v)
    db.commit()
    db.refresh(tpl)
    return tpl

def delete_default_template(db, tpl_id):
    tpl = db.query(DefaultCategoryTemplate).filter(DefaultCategoryTemplate.id == tpl_id).first()
    if not tpl:
        raise NotFoundError("Template not found")
    tpl.is_active = False
    db.commit()

def seed_default_templates_if_empty(db):
    from app.shared.enums import CategoryType
    count = db.query(func.count(DefaultCategoryTemplate.id)).scalar()
    if count and count > 0:
        return
    defaults = [
        ("Chi tiêu thiết yếu", 0, CategoryType.expense, [
            ("Ăn uống", "fast-food", "#FF6B6B"), ("Nhà ở", "home", "#4ECDC4"),
            ("Di chuyển", "car", "#45B7D1"), ("Sức khỏe", "medical", "#96CEB4"),
            ("Mua sắm", "cart", "#FFEAA7"),
        ]),
        ("Giải trí & Phong cách sống", 1, CategoryType.expense, [
            ("Giải trí", "film", "#DDA0DD"), ("Cafe & Đồ uống", "cafe", "#A0522D"),
            ("Giáo dục", "book", "#6C5CE7"), ("Thể thao", "football", "#00B894"),
            ("Du lịch", "airplane", "#74B9FF"),
        ]),
        ("Hóa đơn & Tiện ích", 2, CategoryType.expense, [
            ("Điện & Nước", "bulb", "#FD79A8"), ("Internet & Điện thoại", "phone-portrait", "#55EFC4"),
            ("Bảo hiểm", "shield", "#FDCB6E"),
        ]),
        ("Chi phí khác", 3, CategoryType.expense, [
            ("Khác", "ellipsis-horizontal", "#B2BEC3"),
        ]),
        ("Thu nhập", 4, CategoryType.income, [
            ("Lương", "briefcase", "#00B894"), ("Thưởng", "trophy", "#FDCB6E"),
            ("Quà tặng", "gift", "#E17055"), ("Đầu tư", "trending-up", "#6C5CE7"),
            ("Thu nhập phụ", "cash", "#00CEC9"), ("Khác", "ellipsis-horizontal", "#B2BEC3"),
        ]),
    ]
    for group_name, sort_order, cat_type, items in defaults:
        for name, icon, color in items:
            db.add(DefaultCategoryTemplate(
                group_name=group_name, group_sort_order=sort_order,
                name=name, type=cat_type, icon=icon, color=color, is_active=True,
            ))
    db.commit()
