from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, field_validator

class BudgetEntryOut(BaseModel):
    id: int
    user_id: int
    category_id: int
    period_month: str
    budgeted: Decimal
    activity: Decimal
    available: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class AssignMoneyRequest(BaseModel):
    category_id: int
    period_month: str
    amount: Decimal

    @field_validator("period_month")
    @classmethod
    def validate_period_month(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m")
        except ValueError:
            raise ValueError("period_month must be in YYYY-MM format")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v < Decimal("0"):
            raise ValueError("amount cannot be negative")
        return v

class AssignMoneyResponse(BaseModel):
    entry: BudgetEntryOut
    to_be_budgeted: Decimal
    is_overbudgeted: bool

class MoveMoneyRequest(BaseModel):
    from_category_id: int
    to_category_id: int
    period_month: str
    amount: Decimal

    @field_validator("period_month")
    @classmethod
    def validate_period_month(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m")
        except ValueError:
            raise ValueError("period_month must be in YYYY-MM format")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("amount must be positive")
        return v

class MoveMoneyResponse(BaseModel):
    from_entry: BudgetEntryOut
    to_entry: BudgetEntryOut
    from_overspent: bool
    to_overspent: bool

class MonthSummaryOut(BaseModel):
    period_month: str
    to_be_budgeted: Decimal
    total_budgeted: Decimal
    total_activity: Decimal
    total_available: Decimal
    entries: List[BudgetEntryOut]

class BudgetAlertOut(BaseModel):
    id: int
    entry_id: int
    user_id: int
    triggered_percent: int
    message: Optional[str]
    triggered_at: datetime
    is_read: bool

    model_config = {"from_attributes": True}
