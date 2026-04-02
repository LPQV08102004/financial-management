from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.analytics import service
from app.modules.analytics.schemas import BalanceSummaryOut, CategoryStatOut, TimePointOut

# ── Router instances (imported by main.py) ────────────────────────────────────
dashboard_router = APIRouter(prefix="/analytics/dashboard", tags=["Dashboard"])
reports_router = APIRouter(prefix="/analytics/reports", tags=["Analytics Reports"])


# ── Dashboard endpoints ────────────────────────────────────────────────────────

@dashboard_router.get("/balance", response_model=BalanceSummaryOut)
def get_balance(
    period: str = Query("month", description="day | week | month | year | custom"),
    date: Optional[str] = Query(None, description="Reference date YYYY-MM-DD (default: today)"),
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (required for custom)"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (required for custom)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get total income, total expense, and net balance for the given period."""
    return service.get_balance(db, current_user.id, period, date, from_date, to_date)


# ── Reports endpoints ──────────────────────────────────────────────────────────

@reports_router.get("/by-category", response_model=List[CategoryStatOut])
def stats_by_category(
    type: str = Query("expense", description="income | expense | all"),
    period: str = Query("month", description="day | week | month | year | custom"),
    date: Optional[str] = Query(None, description="Reference date YYYY-MM-DD (default: today)"),
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (required for custom)"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (required for custom)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Per-category spending/income totals — for pie/donut charts."""
    return service.get_stats_by_category(
        db, current_user.id, type, period, date, from_date, to_date
    )


@reports_router.get("/over-time", response_model=List[TimePointOut])
def stats_over_time(
    type: str = Query("all", description="income | expense | all"),
    period: str = Query("week", description="day | week | month | year | custom"),
    date: Optional[str] = Query(None, description="Reference date YYYY-MM-DD (default: today)"),
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (required for custom)"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (required for custom)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Time-series income/expense grouped by sub-intervals of the period — for bar charts.
    year → monthly groups (T1..T12); all others → daily groups (DD/MM).
    """
    return service.get_over_time(
        db, current_user.id, type, period, date, from_date, to_date
    )
