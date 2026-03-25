from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from app.shared.enums import TransactionType


class IncomeCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime
    tag_ids: Optional[List[int]] = []


class ExpenseCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime
    tag_ids: Optional[List[int]] = []


class TransferCreate(BaseModel):
    account_id: int
    target_account_id: int
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime


class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    amount: Optional[Decimal] = None
    note: Optional[str] = None
    transaction_date: Optional[datetime] = None
    tag_ids: Optional[List[int]] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    target_account_id: Optional[int]
    category_id: Optional[int]
    subcategory_id: Optional[int]
    type: TransactionType
    amount: Decimal
    note: Optional[str]
    transaction_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
