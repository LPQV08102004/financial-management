from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator

from app.shared.enums import GoalStatus

class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target_amount: Decimal = Field(gt=0, decimal_places=2)
    deadline: date
    note: Optional[str] = None

    @model_validator(mode="after")
    def deadline_must_be_future(self):
        if self.deadline <= date.today():
            raise ValueError("Ngày mục tiêu phải ở tương lai")
        return self

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    target_amount: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    deadline: Optional[date] = None
    note: Optional[str] = None

class DepositWithdrawRequest(BaseModel):
    amount: Decimal = Field(gt=0, decimal_places=2)
    account_id: int
    transaction_date: datetime

class SavingsGoalOut(BaseModel):
    id: int
    name: str
    target_amount: Decimal
    saved_amount: Decimal
    deadline: date
    note: Optional[str]
    status: GoalStatus
    progress_pct: float
    amount_remaining: Decimal
    months_remaining: int
    monthly_needed: Decimal
    is_active: bool

    model_config = {"from_attributes": True}

class SavingsGoalListResponse(BaseModel):
    items: List[SavingsGoalOut]
    total_locked: Decimal
