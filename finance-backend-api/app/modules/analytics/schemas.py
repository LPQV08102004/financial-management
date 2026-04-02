from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


class BalanceSummaryOut(BaseModel):
    """Response for GET /analytics/dashboard/balance"""
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    period: str
    from_date: str
    to_date: str


class CategoryStatOut(BaseModel):
    """One slice in the by-category chart (pie/donut)."""
    category_id: Optional[int] = None
    category: str
    amount: Decimal
    color: Optional[str] = None
    percentage: float


class TimePointOut(BaseModel):
    """One bar/point in the over-time chart."""
    label: str
    income: Decimal
    expense: Decimal
