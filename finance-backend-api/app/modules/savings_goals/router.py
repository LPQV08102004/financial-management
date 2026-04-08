from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.savings_goals import service
from app.modules.savings_goals.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    DepositWithdrawRequest,
    SavingsGoalOut,
    SavingsGoalListResponse,
)

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


@router.get("", response_model=SavingsGoalListResponse)
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active savings goals for the current user, ordered by deadline."""
    items, total_locked = service.list_goals(db, current_user.id)
    return SavingsGoalListResponse(items=items, total_locked=total_locked)


@router.post("", response_model=SavingsGoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    body: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new savings goal."""
    return service.create_goal(db, current_user.id, body.model_dump())


@router.get("/{goal_id}", response_model=SavingsGoalOut)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_goal(db, goal_id, current_user.id)


@router.patch("/{goal_id}", response_model=SavingsGoalOut)
def update_goal(
    goal_id: int,
    body: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit name, target_amount, deadline, or note. Monthly plan auto-recalculated."""
    return service.update_goal(db, goal_id, current_user.id, body.model_dump(exclude_none=True))


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a savings goal (is_active = False)."""
    service.delete_goal(db, goal_id, current_user.id)


@router.post("/{goal_id}/deposit", response_model=SavingsGoalOut)
def deposit(
    goal_id: int,
    body: DepositWithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Commit savings toward the goal.
    Debits account balance + increases saved_amount atomically.
    Creates an expense transaction tagged '[Tiết kiệm] {goal name}'.
    """
    return service.deposit(
        db, goal_id, current_user.id,
        body.amount, body.account_id, body.transaction_date,
    )


@router.post("/{goal_id}/withdraw", response_model=SavingsGoalOut)
def withdraw(
    goal_id: int,
    body: DepositWithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Withdraw savings back from the goal.
    Credits account balance + decreases saved_amount atomically.
    Creates an income transaction tagged '[Rút tiết kiệm] {goal name}'.
    """
    return service.withdraw(
        db, goal_id, current_user.id,
        body.amount, body.account_id, body.transaction_date,
    )
