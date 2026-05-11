import json
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, BadRequestError
from app.modules.savings_goals.models import SavingsGoal
from app.modules.savings_goals.schemas import SavingsGoalOut
from app.modules.transactions.models import Transaction
from app.modules.accounts.models import Account
from app.modules.budgets.models import AuditLog
from app.shared.enums import GoalStatus, TransactionType, ReconcileStatus, AuditAction

def _compute_status(goal: SavingsGoal) -> GoalStatus:
    if goal.saved_amount >= goal.target_amount:
        return GoalStatus.completed
    if goal.deadline < date.today():
        return GoalStatus.overdue
    return GoalStatus.in_progress

def _months_remaining(deadline: date) -> int:
    today = date.today()
    if deadline <= today:
        return 0
    return (deadline.year - today.year) * 12 + (deadline.month - today.month)

def _to_out(goal: SavingsGoal) -> SavingsGoalOut:
    status = _compute_status(goal)
    saved = Decimal(str(goal.saved_amount))
    target = Decimal(str(goal.target_amount))
    remaining = max(target - saved, Decimal("0"))
    months = _months_remaining(goal.deadline)
    monthly_needed = (remaining / months) if months > 0 else remaining
    progress_pct = float(min(saved / target * 100, Decimal("100"))) if target > 0 else 0.0

    return SavingsGoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=target,
        saved_amount=saved,
        deadline=goal.deadline,
        note=goal.note,
        status=status,
        progress_pct=round(progress_pct, 2),
        amount_remaining=remaining,
        months_remaining=months,
        monthly_needed=monthly_needed.quantize(Decimal("0.01")),
        is_active=goal.is_active,
    )

def _get_own(db: Session, goal_id: int, user_id: int) -> SavingsGoal:
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active == True,
    ).first()
    if not goal:
        raise NotFoundError("Không tìm thấy mục tiêu tiết kiệm")
    return goal

def create_goal(db: Session, user_id: int, payload: dict) -> SavingsGoalOut:
    goal = SavingsGoal(user_id=user_id, **payload)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_out(goal)

def list_goals(db: Session, user_id: int) -> tuple[list[SavingsGoalOut], Decimal]:
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active == True,
    ).order_by(SavingsGoal.deadline.asc()).all()

    items = [_to_out(g) for g in goals]
    total_locked = sum(
        (i.saved_amount for i in items if i.status == GoalStatus.in_progress),
        Decimal("0"),
    )
    return items, total_locked

def get_goal(db: Session, goal_id: int, user_id: int) -> SavingsGoalOut:
    return _to_out(_get_own(db, goal_id, user_id))

def update_goal(db: Session, goal_id: int, user_id: int, payload: dict) -> SavingsGoalOut:
    goal = _get_own(db, goal_id, user_id)

    new_deadline = payload.get("deadline")
    if new_deadline and new_deadline <= date.today():
        raise BadRequestError("Ngày mục tiêu phải ở tương lai")

    for field, value in payload.items():
        if value is not None:
            setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return _to_out(goal)

def delete_goal(db: Session, goal_id: int, user_id: int) -> None:
    goal = _get_own(db, goal_id, user_id)
    goal.is_active = False
    db.commit()

def _get_account(db: Session, account_id: int, user_id: int) -> Account:
    acc = db.query(Account).filter(
        Account.id == account_id, Account.user_id == user_id
    ).first()
    if not acc:
        raise NotFoundError(f"Tài khoản {account_id} không tìm thấy")
    return acc

def _write_audit(db: Session, user_id: int, action: AuditAction, txn_id: int, data: dict) -> None:
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        entity_type="transaction",
        entity_id=txn_id,
        before_data=None,
        after_data=json.dumps(data, default=str),
    ))

def deposit(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: Decimal,
    account_id: int,
    transaction_date: datetime,
) -> SavingsGoalOut:
    goal = _get_own(db, goal_id, user_id)
    if _compute_status(goal) == GoalStatus.completed:
        raise BadRequestError("Mục tiêu đã hoàn thành, không thể nạp thêm tiền")

    remaining = Decimal(str(goal.target_amount)) - Decimal(str(goal.saved_amount))
    if amount > remaining:
        raise BadRequestError(
            f"Số tiền nạp ({amount:,.0f}) vượt quá số tiền còn thiếu ({remaining:,.0f})"
        )

    acc = _get_account(db, account_id, user_id)

    acc_balance = Decimal(str(acc.current_balance))
    if amount > acc_balance:
        raise BadRequestError(
            f"Số dư tài khoản không đủ. Số dư hiện tại: {acc_balance:,.0f} đ"
        )

    txn = Transaction(
        user_id=user_id,
        account_id=account_id,
        type=TransactionType.expense,
        amount=amount,
        note=f"[Tiết kiệm] {goal.name}",
        transaction_date=transaction_date,
        reconcile_status=ReconcileStatus.uncleared,
        is_split=False,
    )
    db.add(txn)
    acc.current_balance = Decimal(str(acc.current_balance)) - amount
    goal.saved_amount = Decimal(str(goal.saved_amount)) + amount
    db.flush()

    _write_audit(db, user_id, AuditAction.create_transaction, txn.id, {
        "type": "savings_deposit", "goal_id": goal_id,
        "amount": str(amount), "account_id": account_id,
    })

    db.commit()
    db.refresh(goal)
    return _to_out(goal)

def withdraw(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: Decimal,
    account_id: int,
    transaction_date: datetime,
) -> SavingsGoalOut:
    goal = _get_own(db, goal_id, user_id)
    current = Decimal(str(goal.saved_amount))
    if amount > current:
        raise BadRequestError(
            f"Số tiền rút ({amount:,.0f}) vượt quá số tiền đã tích lũy ({current:,.0f})"
        )

    acc = _get_account(db, account_id, user_id)

    txn = Transaction(
        user_id=user_id,
        account_id=account_id,
        type=TransactionType.income,
        amount=amount,
        note=f"[Rút tiết kiệm] {goal.name}",
        transaction_date=transaction_date,
        reconcile_status=ReconcileStatus.uncleared,
        is_split=False,
    )
    db.add(txn)
    acc.current_balance = Decimal(str(acc.current_balance)) + amount
    goal.saved_amount = current - amount
    db.flush()

    _write_audit(db, user_id, AuditAction.create_transaction, txn.id, {
        "type": "savings_withdraw", "goal_id": goal_id,
        "amount": str(amount), "account_id": account_id,
    })

    db.commit()
    db.refresh(goal)
    return _to_out(goal)
