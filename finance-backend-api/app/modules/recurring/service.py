import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, BadRequestError
from app.modules.recurring.models import RecurringTemplate
from app.modules.recurring.schemas import (
    RecurringTemplateOut, UpcomingOccurrence, UpcomingListResponse, GenerateResult,
)
from app.modules.transactions.models import Transaction
from app.modules.accounts.models import Account
from app.modules.categories.models import Category
from app.shared.enums import RecurringFrequency, TransactionType, ReconcileStatus

_FREQ_LABELS = {
    RecurringFrequency.daily: "Hàng ngày",
    RecurringFrequency.weekly: "Hàng tuần",
    RecurringFrequency.monthly: "Hàng tháng",
    RecurringFrequency.yearly: "Hàng năm",
}

# Max transactions to auto-generate per template per call (safety cap)
_MAX_GEN_PER_TEMPLATE = 12


# ── Date helpers ───────────────────────────────────────────────────────────────

def _advance_date(current: date, freq: RecurringFrequency, original_day: int) -> date:
    """Return the next occurrence date after `current` for the given frequency."""
    if freq == RecurringFrequency.daily:
        return current + timedelta(days=1)
    if freq == RecurringFrequency.weekly:
        return current + timedelta(weeks=1)
    if freq == RecurringFrequency.monthly:
        month = current.month + 1
        year = current.year
        if month > 12:
            month = 1
            year += 1
        last_day = calendar.monthrange(year, month)[1]
        return date(year, month, min(original_day, last_day))
    if freq == RecurringFrequency.yearly:
        year = current.year + 1
        # Handle Feb 29 in non-leap years
        try:
            return date(year, current.month, current.day)
        except ValueError:
            return date(year, current.month, 28)


def _first_run_date(start: date, freq: RecurringFrequency) -> date:
    """Compute next_run_date when creating a template."""
    return start


def _occurrences_in_range(
    template: RecurringTemplate, from_date: date, to_date: date
) -> List[date]:
    """List all scheduled dates for `template` within [from_date, to_date]."""
    original_day = template.start_date.day
    results = []
    current = template.next_run_date
    count = 0
    while current <= to_date and count < 366:
        count += 1
        if template.end_date and current > template.end_date:
            break
        if current >= from_date:
            results.append(current)
        current = _advance_date(current, template.frequency, original_day)
    return results


# ── Mapping helpers ────────────────────────────────────────────────────────────

def _build_cat_map(db: Session, user_id: int) -> dict:
    cats = db.query(Category).filter(Category.user_id == user_id).all()
    return {c.id: c.name for c in cats}


def _build_acc_map(db: Session, user_id: int) -> dict:
    accs = db.query(Account).filter(Account.user_id == user_id).all()
    return {a.id: a.name for a in accs}


def _to_out(tmpl: RecurringTemplate, cat_map: dict, acc_map: dict) -> RecurringTemplateOut:
    return RecurringTemplateOut(
        id=tmpl.id,
        name=tmpl.name,
        type=tmpl.type,
        amount=Decimal(str(tmpl.amount)),
        category_id=tmpl.category_id,
        category_name=cat_map.get(tmpl.category_id) if tmpl.category_id else None,
        account_id=tmpl.account_id,
        account_name=acc_map.get(tmpl.account_id),
        frequency=tmpl.frequency,
        frequency_label=_FREQ_LABELS[tmpl.frequency],
        start_date=tmpl.start_date,
        end_date=tmpl.end_date,
        next_run_date=tmpl.next_run_date,
        note=tmpl.note,
        is_active=tmpl.is_active,
    )


def _get_own(db: Session, template_id: int, user_id: int) -> RecurringTemplate:
    tmpl = db.query(RecurringTemplate).filter(
        RecurringTemplate.id == template_id,
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_active == True,
    ).first()
    if not tmpl:
        raise NotFoundError("Không tìm thấy giao dịch định kỳ")
    return tmpl


# ── CRUD ───────────────────────────────────────────────────────────────────────

def create_template(db: Session, user_id: int, payload: dict) -> RecurringTemplateOut:
    # Verify account belongs to user
    acc = db.query(Account).filter(
        Account.id == payload["account_id"], Account.user_id == user_id
    ).first()
    if not acc:
        raise NotFoundError("Tài khoản không tồn tại")

    # Verify category belongs to user (if provided)
    cat_id = payload.get("category_id")
    if cat_id:
        cat = db.query(Category).filter(
            Category.id == cat_id, Category.user_id == user_id
        ).first()
        if not cat:
            raise NotFoundError("Danh mục không tồn tại")

    start = payload["start_date"]
    freq = payload["frequency"]
    next_run = _first_run_date(start, freq)

    tmpl = RecurringTemplate(
        user_id=user_id,
        next_run_date=next_run,
        **{k: v for k, v in payload.items()},
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)

    cat_map = _build_cat_map(db, user_id)
    acc_map = _build_acc_map(db, user_id)
    return _to_out(tmpl, cat_map, acc_map)


def list_templates(db: Session, user_id: int) -> List[RecurringTemplateOut]:
    tmpls = db.query(RecurringTemplate).filter(
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_active == True,
    ).order_by(RecurringTemplate.next_run_date.asc()).all()

    cat_map = _build_cat_map(db, user_id)
    acc_map = _build_acc_map(db, user_id)
    return [_to_out(t, cat_map, acc_map) for t in tmpls]


def get_template(db: Session, template_id: int, user_id: int) -> RecurringTemplateOut:
    tmpl = _get_own(db, template_id, user_id)
    cat_map = _build_cat_map(db, user_id)
    acc_map = _build_acc_map(db, user_id)
    return _to_out(tmpl, cat_map, acc_map)


def update_template(db: Session, template_id: int, user_id: int, payload: dict) -> RecurringTemplateOut:
    tmpl = _get_own(db, template_id, user_id)

    # Validate account/category ownership if being changed
    if "account_id" in payload:
        acc = db.query(Account).filter(
            Account.id == payload["account_id"], Account.user_id == user_id
        ).first()
        if not acc:
            raise NotFoundError("Tài khoản không tồn tại")

    if "category_id" in payload and payload["category_id"] is not None:
        cat = db.query(Category).filter(
            Category.id == payload["category_id"], Category.user_id == user_id
        ).first()
        if not cat:
            raise NotFoundError("Danh mục không tồn tại")

    for field, value in payload.items():
        setattr(tmpl, field, value)

    db.commit()
    db.refresh(tmpl)

    cat_map = _build_cat_map(db, user_id)
    acc_map = _build_acc_map(db, user_id)
    return _to_out(tmpl, cat_map, acc_map)


def delete_template(db: Session, template_id: int, user_id: int) -> None:
    tmpl = _get_own(db, template_id, user_id)
    tmpl.is_active = False
    db.commit()


# ── Upcoming (US-B2) ───────────────────────────────────────────────────────────

def get_upcoming(db: Session, user_id: int, days: int = 30) -> UpcomingListResponse:
    today = date.today()
    to_date = today + timedelta(days=days)

    tmpls = db.query(RecurringTemplate).filter(
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_active == True,
    ).all()

    cat_map = _build_cat_map(db, user_id)
    acc_map = _build_acc_map(db, user_id)

    items: List[UpcomingOccurrence] = []
    total_expense = Decimal("0")
    total_income = Decimal("0")

    for tmpl in tmpls:
        occurrences = _occurrences_in_range(tmpl, today, to_date)
        for occ_date in occurrences:
            amount = Decimal(str(tmpl.amount))
            items.append(UpcomingOccurrence(
                template_id=tmpl.id,
                name=tmpl.name,
                type=tmpl.type,
                amount=amount,
                category_id=tmpl.category_id,
                category_name=cat_map.get(tmpl.category_id) if tmpl.category_id else None,
                account_id=tmpl.account_id,
                account_name=acc_map.get(tmpl.account_id),
                scheduled_date=occ_date,
                frequency_label=_FREQ_LABELS[tmpl.frequency],
                note=tmpl.note,
            ))
            if tmpl.type == TransactionType.expense:
                total_expense += amount
            else:
                total_income += amount

    # Sort by date ascending
    items.sort(key=lambda x: x.scheduled_date)

    return UpcomingListResponse(
        items=items,
        total_expense=total_expense,
        total_income=total_income,
    )


# ── Generate transactions ──────────────────────────────────────────────────────

def _generate_for_template(
    db: Session, tmpl: RecurringTemplate, up_to: date
) -> int:
    """
    Create uncleared transactions for all overdue dates up to `up_to`.
    Advances next_run_date past up_to.
    Returns number of transactions created.
    """
    original_day = tmpl.start_date.day
    generated = 0

    while tmpl.next_run_date <= up_to and generated < _MAX_GEN_PER_TEMPLATE:
        # Stop if end_date passed
        if tmpl.end_date and tmpl.next_run_date > tmpl.end_date:
            tmpl.is_active = False
            break

        txn = Transaction(
            user_id=tmpl.user_id,
            account_id=tmpl.account_id,
            category_id=tmpl.category_id,
            type=tmpl.type,
            amount=tmpl.amount,
            note=f"[Định kỳ] {tmpl.name}" + (f" — {tmpl.note}" if tmpl.note else ""),
            transaction_date=datetime.combine(tmpl.next_run_date, datetime.min.time()),
            reconcile_status=ReconcileStatus.uncleared,
            is_split=False,
        )
        db.add(txn)

        # Update account balance
        acc = db.query(Account).filter(Account.id == tmpl.account_id).first()
        if acc:
            bal = Decimal(str(acc.current_balance))
            if tmpl.type == TransactionType.expense:
                acc.current_balance = bal - Decimal(str(tmpl.amount))
            else:
                acc.current_balance = bal + Decimal(str(tmpl.amount))

        tmpl.next_run_date = _advance_date(tmpl.next_run_date, tmpl.frequency, original_day)
        generated += 1

    return generated


def generate_due(db: Session, template_id: int, user_id: int) -> GenerateResult:
    """Manually generate all overdue transactions for one template."""
    tmpl = _get_own(db, template_id, user_id)
    today = date.today()

    if tmpl.next_run_date > today:
        return GenerateResult(
            generated_count=0,
            skipped_count=0,
            message="Chưa đến ngày tạo giao dịch định kỳ",
        )

    generated = _generate_for_template(db, tmpl, today)
    db.commit()

    return GenerateResult(
        generated_count=generated,
        skipped_count=0,
        message=f"Đã tạo {generated} giao dịch định kỳ",
    )


def process_all_due(db: Session, user_id: int) -> GenerateResult:
    """Generate all overdue transactions across all active templates for this user."""
    today = date.today()

    due_templates = db.query(RecurringTemplate).filter(
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_active == True,
        RecurringTemplate.next_run_date <= today,
    ).all()

    total_generated = 0
    for tmpl in due_templates:
        total_generated += _generate_for_template(db, tmpl, today)

    db.commit()

    return GenerateResult(
        generated_count=total_generated,
        skipped_count=0,
        message=f"Đã xử lý {len(due_templates)} giao dịch định kỳ, tạo {total_generated} giao dịch",
    )
