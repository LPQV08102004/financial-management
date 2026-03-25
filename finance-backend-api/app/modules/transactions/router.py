from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.transactions import service
from app.modules.transactions.schemas import (
    IncomeCreate, ExpenseCreate, TransferCreate,
    TransactionUpdate, TransactionOut,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/income", response_model=TransactionOut, status_code=201)
def create_income(
    body: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an income transaction and credit the account."""
    return service.create_income(db, current_user.id, body.model_dump())


@router.post("/expense", response_model=TransactionOut, status_code=201)
def create_expense(
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an expense transaction and debit the account."""
    return service.create_expense(db, current_user.id, body.model_dump())


@router.post("/transfer", response_model=TransactionOut, status_code=201)
def create_transfer(
    body: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transfer funds between two accounts."""
    return service.create_transfer(db, current_user.id, body.model_dump())


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    type: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_transactions(
        db, current_user.id, type, account_id, from_date, to_date, skip, limit
    )


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_transaction(db, txn_id, current_user.id)


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(
    txn_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_transaction(db, txn_id, current_user.id, body.model_dump(exclude_none=True))


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_transaction(db, txn_id, current_user.id)
