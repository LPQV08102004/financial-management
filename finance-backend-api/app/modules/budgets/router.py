from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.budgets import service
from app.modules.budgets.schemas import BudgetCreate, BudgetUpdate, BudgetOut, BudgetStatus

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(
    body: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_budget(db, current_user.id, body.model_dump())


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_budgets(db, current_user.id, month)


@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_budget(db, budget_id, current_user.id, body.model_dump(exclude_none=True))


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_budget(db, budget_id, current_user.id)


@router.get("/{budget_id}/status", response_model=BudgetStatus)
def get_budget_status(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get spending status vs budget limit. Auto-raises alert if threshold exceeded."""
    return service.get_budget_status(db, budget_id, current_user.id)
