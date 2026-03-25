from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: int
    period_month: str  # YYYY-MM
    amount_limit: Decimal
    alert_threshold_percent: int = 80


class BudgetUpdate(BaseModel):
    amount_limit: Optional[Decimal] = None
    alert_threshold_percent: Optional[int] = None


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category_id: int
    period_month: str
    amount_limit: Decimal
    alert_threshold_percent: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetStatus(BaseModel):
    budget_id: int
    category_id: int
    period_month: str
    amount_limit: Decimal
    amount_spent: Decimal
    percent_used: float
    is_exceeded: bool
    alert_threshold_percent: int
    is_alert_triggered: bool
