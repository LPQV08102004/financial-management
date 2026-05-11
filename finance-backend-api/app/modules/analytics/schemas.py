from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

class BalanceSummaryOut(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    period: str
    from_date: str
    to_date: str

class CategoryStatOut(BaseModel):
    category_id: Optional[int] = None
    category: str
    amount: Decimal
    color: Optional[str] = None
    percentage: float

class TimePointOut(BaseModel):
    label: str
    income: Decimal
    expense: Decimal
