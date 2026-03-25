from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.budgets.models import Budget, BudgetAlert
from app.modules.transactions.models import Transaction
from app.shared.enums import TransactionType
from app.core.exceptions import NotFoundError, ForbiddenError
from app.shared.utils import parse_month


def _get_budget_or_404(db: Session, budget_id: int, user_id: int) -> Budget:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise NotFoundError("Budget not found")
    if budget.user_id != user_id:
        raise ForbiddenError()
    return budget


def create_budget(db: Session, user_id: int, data: dict) -> Budget:
    budget = Budget(user_id=user_id, **data)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def list_budgets(db: Session, user_id: int, month: str | None) -> list[Budget]:
    q = db.query(Budget).filter(Budget.user_id == user_id)
    if month:
        q = q.filter(Budget.period_month == month)
    return q.all()


def update_budget(db: Session, budget_id: int, user_id: int, data: dict) -> Budget:
    budget = _get_budget_or_404(db, budget_id, user_id)
    for k, v in data.items():
        if v is not None:
            setattr(budget, k, v)
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget_id: int, user_id: int) -> None:
    budget = _get_budget_or_404(db, budget_id, user_id)
    db.delete(budget)
    db.commit()


def get_budget_status(db: Session, budget_id: int, user_id: int) -> dict:
    budget = _get_budget_or_404(db, budget_id, user_id)
    first_day, last_day = parse_month(budget.period_month)

    spent_row = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == TransactionType.expense,
            Transaction.transaction_date >= datetime.combine(first_day, datetime.min.time()),
            Transaction.transaction_date < datetime.combine(last_day, datetime.min.time()),
        )
        .scalar()
    )

    amount_spent = Decimal(str(spent_row))
    amount_limit = Decimal(str(budget.amount_limit))
    percent_used = float(amount_spent / amount_limit * 100) if amount_limit > 0 else 0.0
    is_alert = percent_used >= budget.alert_threshold_percent

    # Auto-create alert if threshold crossed and no unread alert for this budget
    if is_alert:
        existing_alert = (
            db.query(BudgetAlert)
            .filter(
                BudgetAlert.budget_id == budget_id,
                BudgetAlert.triggered_percent == budget.alert_threshold_percent,
                BudgetAlert.is_read == False,  # noqa: E712
            )
            .first()
        )
        if not existing_alert:
            alert = BudgetAlert(
                budget_id=budget_id,
                user_id=user_id,
                triggered_percent=int(percent_used),
                message=f"Budget for category {budget.category_id} has reached {percent_used:.1f}%",
            )
            db.add(alert)
            db.commit()

    return {
        "budget_id": budget_id,
        "category_id": budget.category_id,
        "period_month": budget.period_month,
        "amount_limit": amount_limit,
        "amount_spent": amount_spent,
        "percent_used": round(percent_used, 2),
        "is_exceeded": amount_spent > amount_limit,
        "alert_threshold_percent": budget.alert_threshold_percent,
        "is_alert_triggered": is_alert,
    }
