from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator

from app.shared.enums import TransactionType, RecurringFrequency

_FREQ_LABELS = {
    RecurringFrequency.daily: "Hàng ngày",
    RecurringFrequency.weekly: "Hàng tuần",
    RecurringFrequency.monthly: "Hàng tháng",
    RecurringFrequency.yearly: "Hàng năm",
}


class RecurringTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    type: TransactionType
    amount: Decimal = Field(gt=0, decimal_places=2)
    category_id: Optional[int] = None
    account_id: int
    frequency: RecurringFrequency
    start_date: date
    end_date: Optional[date] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates_and_type(self):
        if self.type == TransactionType.transfer:
            raise ValueError("Giao dịch định kỳ không hỗ trợ loại 'transfer'")
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        return self


class RecurringTemplateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    amount: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    end_date: Optional[date] = None
    note: Optional[str] = None


class RecurringTemplateOut(BaseModel):
    id: int
    name: str
    type: TransactionType
    amount: Decimal
    category_id: Optional[int]
    category_name: Optional[str]
    account_id: int
    account_name: Optional[str]
    frequency: RecurringFrequency
    frequency_label: str
    start_date: date
    end_date: Optional[date]
    next_run_date: date
    note: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class UpcomingOccurrence(BaseModel):
    template_id: int
    name: str
    type: TransactionType
    amount: Decimal
    category_id: Optional[int]
    category_name: Optional[str]
    account_id: int
    account_name: Optional[str]
    scheduled_date: date
    frequency_label: str
    note: Optional[str]


class UpcomingListResponse(BaseModel):
    items: List[UpcomingOccurrence]
    total_expense: Decimal
    total_income: Decimal


class GenerateResult(BaseModel):
    generated_count: int
    skipped_count: int
    message: str
