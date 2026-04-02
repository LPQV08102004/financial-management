from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.transactions.models import Transaction
from app.modules.categories.models import Category
from app.shared.enums import TransactionType
from app.core.exceptions import BadRequestError


# ── Date-range helper ──────────────────────────────────────────────────────────

def _parse_date_range(
    period: str,
    date_str: Optional[str],
    from_date_str: Optional[str],
    to_date_str: Optional[str],
) -> Tuple[datetime, datetime]:
    """Return (start_dt, end_dt) inclusive range derived from period parameters."""
    if period == "custom":
        if not from_date_str or not to_date_str:
            raise BadRequestError("from_date and to_date are required for custom period")
        try:
            start = datetime.strptime(from_date_str, "%Y-%m-%d")
            end = datetime.strptime(to_date_str, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59
            )
        except ValueError:
            raise BadRequestError("Date format must be YYYY-MM-DD")
        return start, end

    ref = datetime.today()
    if date_str:
        try:
            ref = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise BadRequestError("date format must be YYYY-MM-DD")

    if period == "day":
        start = ref.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59)

    elif period == "week":
        # Monday-based week containing ref
        start = (ref - timedelta(days=ref.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = (start + timedelta(days=6)).replace(hour=23, minute=59, second=59)

    elif period == "month":
        start = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            next_month_start = start.replace(year=start.year + 1, month=1)
        else:
            next_month_start = start.replace(month=start.month + 1)
        end = next_month_start - timedelta(seconds=1)

    elif period == "year":
        start = ref.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(month=12, day=31, hour=23, minute=59, second=59)

    else:
        raise BadRequestError(
            f"Unknown period '{period}'. Supported: day, week, month, year, custom"
        )

    return start, end


def _to_decimal(value) -> Decimal:
    return Decimal(str(value)) if value is not None else Decimal("0")


# ── Public service functions ───────────────────────────────────────────────────

def get_balance(
    db: Session,
    user_id: int,
    period: str = "month",
    date_str: Optional[str] = None,
    from_date_str: Optional[str] = None,
    to_date_str: Optional[str] = None,
) -> dict:
    """Return total_income, total_expense, and net balance for the requested period."""
    start, end = _parse_date_range(period, date_str, from_date_str, to_date_str)

    base_q = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start,
        Transaction.transaction_date <= end,
    )

    total_income = _to_decimal(
        base_q.filter(Transaction.type == TransactionType.income)
        .with_entities(func.coalesce(func.sum(Transaction.amount), 0))
        .scalar()
    )
    total_expense = _to_decimal(
        base_q.filter(Transaction.type == TransactionType.expense)
        .with_entities(func.coalesce(func.sum(Transaction.amount), 0))
        .scalar()
    )

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "period": period,
        "from_date": start.strftime("%Y-%m-%d"),
        "to_date": end.strftime("%Y-%m-%d"),
    }


def get_stats_by_category(
    db: Session,
    user_id: int,
    txn_type: str = "expense",
    period: str = "month",
    date_str: Optional[str] = None,
    from_date_str: Optional[str] = None,
    to_date_str: Optional[str] = None,
) -> List[dict]:
    """Return per-category totals sorted by amount descending (for pie/donut charts)."""
    if txn_type not in ("income", "expense", "all"):
        raise BadRequestError("type must be income, expense, or all")

    start, end = _parse_date_range(period, date_str, from_date_str, to_date_str)

    q = (
        db.query(
            Category.id.label("category_id"),
            Category.name.label("category"),
            Category.color.label("color"),
            func.sum(Transaction.amount).label("amount"),
        )
        .join(Category, Transaction.category_id == Category.id, isouter=True)
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
            Transaction.type != TransactionType.transfer,
        )
    )

    if txn_type == "income":
        q = q.filter(Transaction.type == TransactionType.income)
    elif txn_type == "expense":
        q = q.filter(Transaction.type == TransactionType.expense)

    rows = (
        q.group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total = sum(_to_decimal(r.amount) for r in rows) or Decimal("1")

    return [
        {
            "category_id": r.category_id,
            "category": r.category if r.category else "Không danh mục",
            "amount": _to_decimal(r.amount),
            "color": r.color,
            "percentage": round(float(_to_decimal(r.amount) / total) * 100, 2),
        }
        for r in rows
    ]


def get_over_time(
    db: Session,
    user_id: int,
    txn_type: str = "all",
    period: str = "week",
    date_str: Optional[str] = None,
    from_date_str: Optional[str] = None,
    to_date_str: Optional[str] = None,
) -> List[dict]:
    """
    Return time-series income/expense grouped by sub-intervals of the period.
    - year  → group by month  (12 points, labels: T1..T12)
    - others → group by day   (labels: DD/MM)
    """
    if txn_type not in ("income", "expense", "all"):
        raise BadRequestError("type must be income, expense, or all")

    start, end = _parse_date_range(period, date_str, from_date_str, to_date_str)

    # Choose grouping granularity
    use_monthly = period == "year"
    if use_monthly:
        group_expr = func.date_format(Transaction.transaction_date, "%Y-%m")
    else:
        group_expr = func.date_format(Transaction.transaction_date, "%Y-%m-%d")

    def _query_type(t_type: TransactionType):
        return (
            db.query(
                group_expr.label("slot"),
                func.sum(Transaction.amount).label("total"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
                Transaction.type == t_type,
            )
            .group_by(group_expr)
            .all()
        )

    income_map: dict = {}
    expense_map: dict = {}

    if txn_type in ("income", "all"):
        income_map = {r.slot: _to_decimal(r.total) for r in _query_type(TransactionType.income)}
    if txn_type in ("expense", "all"):
        expense_map = {r.slot: _to_decimal(r.total) for r in _query_type(TransactionType.expense)}

    # Build all slots in the date range
    slots: List[str] = []
    if use_monthly:
        for m in range(1, 13):
            slots.append(f"{start.year}-{m:02d}")
    else:
        current = start.date()
        while current <= end.date():
            slots.append(str(current))
            current += timedelta(days=1)

    result = []
    for slot in slots:
        inc = income_map.get(slot, Decimal("0"))
        exp = expense_map.get(slot, Decimal("0"))

        # Human-readable label
        if use_monthly:
            label = f"T{int(slot.split('-')[1])}"
        else:
            parts = slot.split("-")
            label = f"{int(parts[2])}/{int(parts[1])}"

        result.append({"label": label, "income": inc, "expense": exp})

    return result
