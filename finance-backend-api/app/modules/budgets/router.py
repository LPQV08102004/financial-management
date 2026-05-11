from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.budgets import service
from app.modules.budgets.schemas import (
    AssignMoneyRequest, AssignMoneyResponse,
    MoveMoneyRequest, MoveMoneyResponse,
    BudgetEntryOut, MonthSummaryOut,
    BudgetAlertOut,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/assign", response_model=AssignMoneyResponse)
def assign_money(
    body: AssignMoneyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry, tbb = service.assign_money(
        db, current_user.id, body.category_id, body.period_month, body.amount
    )
    return AssignMoneyResponse(
        entry=BudgetEntryOut.model_validate(entry),
        to_be_budgeted=tbb,
        is_overbudgeted=tbb < Decimal("0"),
    )

@router.post("/move", response_model=MoveMoneyResponse)
def move_money(
    body: MoveMoneyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from_entry, to_entry = service.move_money(
        db, current_user.id,
        body.from_category_id, body.to_category_id,
        body.period_month, body.amount,
    )
    return MoveMoneyResponse(
        from_entry=BudgetEntryOut.model_validate(from_entry),
        to_entry=BudgetEntryOut.model_validate(to_entry),
        from_overspent=from_entry.available < 0,
        to_overspent=to_entry.available < 0,
    )

@router.get("/summary", response_model=MonthSummaryOut)
def get_month_summary(
    month: str = Query(..., description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_month_summary(db, current_user.id, month)

@router.get("/entries", response_model=List[BudgetEntryOut])
def list_entries(
    month: str = Query(..., description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = service.get_month_summary(db, current_user.id, month)
    return summary["entries"]

@router.get("/entries/{entry_id}", response_model=BudgetEntryOut)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_entry(db, current_user.id, entry_id)

@router.get("/to-be-budgeted")
def get_to_be_budgeted(
    month: str = Query(..., description="Format: YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tbb = service.get_to_be_budgeted(db, current_user.id, month)
    return {"period_month": month, "to_be_budgeted": tbb, "is_overbudgeted": tbb < 0}

@router.get("/alerts", response_model=List[BudgetAlertOut])
def list_alerts(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_alerts(db, current_user.id, unread_only)

@router.patch("/alerts/{alert_id}/read", response_model=BudgetAlertOut)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.mark_alert_read(db, current_user.id, alert_id)
