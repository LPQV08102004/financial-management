from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator
from app.shared.enums import TransactionType, ReconcileStatus


# ── Split support ──────────────────────────────────────────────────────────────

class SplitItemCreate(BaseModel):
    category_id: int
    amount: Decimal
    note: Optional[str] = None


class SplitItemOut(BaseModel):
    id: int
    transaction_id: int
    category_id: Optional[int]
    amount: Decimal
    note: Optional[str]

    model_config = {"from_attributes": True}


# ── Create requests ────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None   # optional – income goes to TBB pool
    subcategory_id: Optional[int] = None
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime
    tag_ids: Optional[List[int]] = []

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("amount must be positive")
        return v


class ExpenseCreate(BaseModel):
    account_id: int
    category_id: int   # required for expenses — must update BudgetEntry
    subcategory_id: Optional[int] = None
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime
    tag_ids: Optional[List[int]] = []

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("amount must be positive")
        return v


class SplitExpenseCreate(BaseModel):
    account_id: int
    amount: Decimal   # total – must equal sum of splits
    note: Optional[str] = None
    transaction_date: datetime
    splits: List[SplitItemCreate]
    tag_ids: Optional[List[int]] = []

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("amount must be positive")
        return v

    @model_validator(mode="after")
    def splits_must_sum_to_total(self) -> "SplitExpenseCreate":
        if not self.splits:
            raise ValueError("splits must not be empty")
        total = sum(s.amount for s in self.splits)
        if total != self.amount:
            raise ValueError(
                f"Sum of splits ({total}) must equal total amount ({self.amount})"
            )
        return self


class TransferCreate(BaseModel):
    account_id: int
    target_account_id: int
    amount: Decimal
    note: Optional[str] = None
    transaction_date: datetime

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("amount must be positive")
        return v


# ── Update / reconcile requests ────────────────────────────────────────────────

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    amount: Optional[Decimal] = None
    note: Optional[str] = None
    transaction_date: Optional[datetime] = None
    tag_ids: Optional[List[int]] = None


class ReconcileUpdate(BaseModel):
    status: ReconcileStatus


# ── Response models ────────────────────────────────────────────────────────────

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
    reconcile_status: ReconcileStatus
    is_split: bool
    created_at: datetime
    # Populated by the router for display convenience
    category_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TransactionWithWarnings(BaseModel):
    """Wraps a transaction response with optional overspend warnings."""
    transaction: TransactionOut
    warnings: List[str] = []


class TransactionListResponse(BaseModel):
    """Paginated transaction list with aggregate metadata for US-F."""
    items: List[TransactionOut]
    total_count: int
    total_amount: Decimal
