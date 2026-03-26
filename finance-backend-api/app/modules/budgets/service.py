import json
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.budgets.models import BudgetEntry, BudgetAlert, AuditLog
from app.modules.categories.models import Category
from app.shared.enums import AuditAction
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


# ── Internal helpers ───────────────────────────────────────────────────────────

def _validate_period_month(period_month: str) -> None:
    try:
        datetime.strptime(period_month, "%Y-%m")
    except ValueError:
        raise BadRequestError("period_month must be in YYYY-MM format")


def _create_audit_log(
    db: Session,
    user_id: int,
    action: AuditAction,
    entity_type: str,
    entity_id: int,
    before_data: dict | None,
    after_data: dict | None,
) -> None:
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_data=json.dumps(before_data, default=str) if before_data else None,
        after_data=json.dumps(after_data, default=str) if after_data else None,
    ))


def _to_decimal(value) -> Decimal:
    """Safely coerce any numeric DB value to Decimal."""
    return Decimal(str(value)) if value is not None else Decimal("0")


# ── Core BudgetEntry operations ────────────────────────────────────────────────

def get_or_create_entry(
    db: Session, user_id: int, category_id: int, period_month: str
) -> BudgetEntry:
    """Fetch or create a BudgetEntry for user/category/month with zero balances."""
    entry = (
        db.query(BudgetEntry)
        .filter(
            BudgetEntry.user_id == user_id,
            BudgetEntry.category_id == category_id,
            BudgetEntry.period_month == period_month,
        )
        .first()
    )
    if not entry:
        entry = BudgetEntry(
            user_id=user_id,
            category_id=category_id,
            period_month=period_month,
            budgeted=Decimal("0"),
            activity=Decimal("0"),
            available=Decimal("0"),
        )
        db.add(entry)
        db.flush()  # get entry.id without committing
    return entry


def update_activity(
    db: Session,
    user_id: int,
    category_id: int,
    period_month: str,
    delta: Decimal,
) -> BudgetEntry:
    """
    Adjust BudgetEntry.activity by delta and recalculate available.
    delta is negative for expenses (outflow), positive for reversals.
    Caller must call db.commit() after all related writes are done.
    """
    entry = get_or_create_entry(db, user_id, category_id, period_month)
    entry.activity = _to_decimal(entry.activity) + delta
    entry.available = _to_decimal(entry.budgeted) + entry.activity
    return entry


# ── TBB calculation ────────────────────────────────────────────────────────────

def get_to_be_budgeted(db: Session, user_id: int, period_month: str) -> Decimal:
    """
    To Be Budgeted = Sum(account.current_balance) - Sum(BudgetEntry.budgeted for month).
    Lazy-imports Account to avoid circular dependency.
    """
    from app.modules.accounts.models import Account

    total_balance = _to_decimal(
        db.query(func.coalesce(func.sum(Account.current_balance), 0))
        .filter(Account.user_id == user_id, Account.is_active == True)  # noqa: E712
        .scalar()
    )
    total_budgeted = _to_decimal(
        db.query(func.coalesce(func.sum(BudgetEntry.budgeted), 0))
        .filter(BudgetEntry.user_id == user_id, BudgetEntry.period_month == period_month)
        .scalar()
    )
    return total_balance - total_budgeted


# ── Public service functions ───────────────────────────────────────────────────

def assign_money(
    db: Session,
    user_id: int,
    category_id: int,
    period_month: str,
    amount: Decimal,
) -> tuple[BudgetEntry, Decimal]:
    """
    Set the budgeted amount for a category in a given month.
    Returns (entry, to_be_budgeted_after).
    Over-budgeting (TBB < 0) is allowed with a warning flag from the caller.
    """
    _validate_period_month(period_month)
    cat = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id, Category.is_active == True)  # noqa: E712
        .first()
    )
    if not cat:
        raise NotFoundError("Category not found")

    entry = get_or_create_entry(db, user_id, category_id, period_month)
    old_budgeted = _to_decimal(entry.budgeted)

    entry.budgeted = amount
    entry.available = amount + _to_decimal(entry.activity)

    _create_audit_log(
        db, user_id, AuditAction.assign_budget, "budget_entry", entry.id,
        {"budgeted": str(old_budgeted), "period_month": period_month},
        {"budgeted": str(amount), "period_month": period_month},
    )

    db.commit()
    db.refresh(entry)

    tbb = get_to_be_budgeted(db, user_id, period_month)
    return entry, tbb


def move_money(
    db: Session,
    user_id: int,
    from_category_id: int,
    to_category_id: int,
    period_month: str,
    amount: Decimal,
) -> tuple[BudgetEntry, BudgetEntry]:
    """
    Move budgeted amount from one category to another in the same month.
    Both entries are updated atomically. Negative available (overspent) is allowed.
    """
    _validate_period_month(period_month)
    if from_category_id == to_category_id:
        raise BadRequestError("Cannot move money to the same category")

    for cat_id in (from_category_id, to_category_id):
        cat = (
            db.query(Category)
            .filter(Category.id == cat_id, Category.user_id == user_id, Category.is_active == True)  # noqa: E712
            .first()
        )
        if not cat:
            raise NotFoundError(f"Category {cat_id} not found")

    from_entry = get_or_create_entry(db, user_id, from_category_id, period_month)
    to_entry = get_or_create_entry(db, user_id, to_category_id, period_month)

    old_from = _to_decimal(from_entry.budgeted)
    old_to = _to_decimal(to_entry.budgeted)

    from_entry.budgeted = old_from - amount
    from_entry.available = from_entry.budgeted + _to_decimal(from_entry.activity)

    to_entry.budgeted = old_to + amount
    to_entry.available = to_entry.budgeted + _to_decimal(to_entry.activity)

    _create_audit_log(
        db, user_id, AuditAction.move_money, "budget_entry", from_entry.id,
        {"from_budgeted": str(old_from), "to_budgeted": str(old_to)},
        {
            "from_budgeted": str(from_entry.budgeted),
            "to_budgeted": str(to_entry.budgeted),
            "amount_moved": str(amount),
        },
    )

    db.commit()
    db.refresh(from_entry)
    db.refresh(to_entry)
    return from_entry, to_entry


def get_month_summary(db: Session, user_id: int, period_month: str) -> dict:
    _validate_period_month(period_month)
    entries = (
        db.query(BudgetEntry)
        .filter(BudgetEntry.user_id == user_id, BudgetEntry.period_month == period_month)
        .all()
    )
    total_budgeted = sum(_to_decimal(e.budgeted) for e in entries)
    total_activity = sum(_to_decimal(e.activity) for e in entries)
    total_available = sum(_to_decimal(e.available) for e in entries)
    tbb = get_to_be_budgeted(db, user_id, period_month)
    return {
        "period_month": period_month,
        "to_be_budgeted": tbb,
        "total_budgeted": total_budgeted,
        "total_activity": total_activity,
        "total_available": total_available,
        "entries": entries,
    }


def get_entry(db: Session, user_id: int, entry_id: int) -> BudgetEntry:
    entry = db.query(BudgetEntry).filter(BudgetEntry.id == entry_id).first()
    if not entry:
        raise NotFoundError("Budget entry not found")
    if entry.user_id != user_id:
        raise ForbiddenError()
    return entry


def list_alerts(db: Session, user_id: int, unread_only: bool) -> list[BudgetAlert]:
    q = db.query(BudgetAlert).filter(BudgetAlert.user_id == user_id)
    if unread_only:
        q = q.filter(BudgetAlert.is_read == False)  # noqa: E712
    return q.order_by(BudgetAlert.triggered_at.desc()).all()


def mark_alert_read(db: Session, user_id: int, alert_id: int) -> BudgetAlert:
    alert = (
        db.query(BudgetAlert)
        .filter(BudgetAlert.id == alert_id, BudgetAlert.user_id == user_id)
        .first()
    )
    if not alert:
        raise NotFoundError("Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert
