from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.categories.models import Category
from app.modules.transactions import service
from app.modules.transactions.schemas import (
    IncomeCreate, ExpenseCreate, SplitExpenseCreate,
    TransferCreate, TransactionUpdate, ReconcileUpdate,
    TransactionOut, TransactionWithWarnings,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/income", response_model=TransactionWithWarnings, status_code=201)
def create_income(
    body: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record income. Credited to account; increases To Be Budgeted pool."""
    txn, warnings = service.create_income(db, current_user.id, body.model_dump())
    return TransactionWithWarnings(transaction=TransactionOut.model_validate(txn), warnings=warnings)


@router.post("/expense", response_model=TransactionWithWarnings, status_code=201)
def create_expense(
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an expense. Debits account and updates BudgetEntry.activity atomically."""
    txn, warnings = service.create_expense(db, current_user.id, body.model_dump())
    return TransactionWithWarnings(transaction=TransactionOut.model_validate(txn), warnings=warnings)


@router.post("/expense/split", response_model=TransactionWithWarnings, status_code=201)
def create_split_expense(
    body: SplitExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a split expense across multiple categories."""
    txn, warnings = service.create_split_expense(db, current_user.id, body.model_dump())
    return TransactionWithWarnings(transaction=TransactionOut.model_validate(txn), warnings=warnings)


@router.post("/transfer", response_model=TransactionOut, status_code=201)
def create_transfer(
    body: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transfer funds between two accounts. No category or budget entry involved."""
    return service.create_transfer(db, current_user.id, body.model_dump())


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    type: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txns = service.list_transactions(
        db, current_user.id, type, account_id, from_date, to_date, skip, limit
    )
    # Bulk-load category names to avoid N+1 queries
    cat_ids = {t.category_id for t in txns if t.category_id}
    cat_map = {}
    if cat_ids:
        cats = db.query(Category).filter(Category.id.in_(cat_ids)).all()
        cat_map = {c.id: c.name for c in cats}

    results = []
    for t in txns:
        out = TransactionOut.model_validate(t)
        out.category_name = cat_map.get(t.category_id) if t.category_id else None
        results.append(out)
    return results


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_transaction(db, txn_id, current_user.id)


@router.patch("/{txn_id}", response_model=TransactionWithWarnings)
def update_transaction(
    txn_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a non-reconciled transaction. BudgetEntry is re-computed if needed."""
    txn, warnings = service.update_transaction(
        db, txn_id, current_user.id, body.model_dump(exclude_none=True)
    )
    return TransactionWithWarnings(transaction=TransactionOut.model_validate(txn), warnings=warnings)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a non-reconciled transaction. Reverses account balance and budget activity."""
    service.delete_transaction(db, txn_id, current_user.id)


@router.patch("/{txn_id}/reconcile", response_model=TransactionOut)
def update_reconcile_status(
    txn_id: int,
    body: ReconcileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update reconciliation status.
    Valid transitions: uncleared → cleared → reconciled.
    Once reconciled the transaction is immutable.
    """
    return service.update_reconcile_status(db, txn_id, current_user.id, body.status)
