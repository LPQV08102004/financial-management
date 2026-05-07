import json
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.transactions.models import Transaction, SplitItem
from app.modules.categories.models import TransactionTag
from app.modules.accounts.models import Account
from app.modules.budgets.models import AuditLog
from app.modules.budgets import service as budget_service
from app.shared.enums import TransactionType, ReconcileStatus, AuditAction
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


# ── Internal helpers ───────────────────────────────────────────────────────────

def _get_account(db: Session, account_id: int, user_id: int) -> Account:
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not acc:
        raise NotFoundError(f"Account {account_id} not found")
    return acc


def _attach_tags(db: Session, txn: Transaction, tag_ids: list[int]) -> None:
    db.query(TransactionTag).filter(TransactionTag.transaction_id == txn.id).delete()
    for tag_id in tag_ids:
        db.add(TransactionTag(transaction_id=txn.id, tag_id=tag_id))


def _audit(
    db: Session,
    user_id: int,
    action: AuditAction,
    entity_id: int,
    before: dict | None,
    after: dict | None,
) -> None:
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        entity_type="transaction",
        entity_id=entity_id,
        before_data=json.dumps(before, default=str) if before else None,
        after_data=json.dumps(after, default=str) if after else None,
    ))


def _check_not_reconciled(txn: Transaction) -> None:
    if txn.reconcile_status == ReconcileStatus.reconciled:
        raise BadRequestError("Reconciled transactions cannot be modified or deleted")


def _period_month(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def _to_decimal(value) -> Decimal:
    return Decimal(str(value)) if value is not None else Decimal("0")


# ── Create operations ──────────────────────────────────────────────────────────

def create_income(db: Session, user_id: int, data: dict) -> tuple[Transaction, list[str]]:
    """
    Record an income transaction.
    Account balance is credited. Income goes to TBB pool (no BudgetEntry update needed).
    """
    acc = _get_account(db, data["account_id"], user_id)
    amount = _to_decimal(data["amount"])

    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        category_id=data.get("category_id"),
        subcategory_id=data.get("subcategory_id"),
        type=TransactionType.income,
        amount=amount,
        note=data.get("note"),
        transaction_date=data["transaction_date"],
        reconcile_status=ReconcileStatus.uncleared,
        is_split=False,
    )
    db.add(txn)
    acc.current_balance = _to_decimal(acc.current_balance) + amount
    db.flush()

    if data.get("tag_ids"):
        _attach_tags(db, txn, data["tag_ids"])

    _audit(db, user_id, AuditAction.create_transaction, txn.id, None, {
        "type": "income", "amount": str(amount),
        "account_id": data["account_id"], "category_id": data.get("category_id"),
    })

    db.commit()
    db.refresh(txn)
    return txn, []


def create_expense(db: Session, user_id: int, data: dict) -> tuple[Transaction, list[str]]:
    """
    Record an expense transaction.
    Account balance is debited. BudgetEntry.activity is decremented atomically.
    Returns overspend warning when available < 0.
    """
    acc = _get_account(db, data["account_id"], user_id)
    amount = _to_decimal(data["amount"])
    category_id: int = data["category_id"]
    month = _period_month(data["transaction_date"])

    balance = _to_decimal(acc.current_balance)
    if amount > balance:
        raise BadRequestError(
            f"Số dư tài khoản không đủ. Số dư hiện tại: {balance:,.0f} đ"
        )
    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        category_id=category_id,
        subcategory_id=data.get("subcategory_id"),
        type=TransactionType.expense,
        amount=amount,
        note=data.get("note"),
        transaction_date=data["transaction_date"],
        reconcile_status=ReconcileStatus.uncleared,
        is_split=False,
    )
    db.add(txn)
    acc.current_balance = _to_decimal(acc.current_balance) - amount
    db.flush()

    # Atomically update BudgetEntry (expense = negative delta)
    entry = budget_service.update_activity(db, user_id, category_id, month, -amount)

    if data.get("tag_ids"):
        _attach_tags(db, txn, data["tag_ids"])

    _audit(db, user_id, AuditAction.create_transaction, txn.id, None, {
        "type": "expense", "amount": str(amount),
        "account_id": data["account_id"], "category_id": category_id, "period_month": month,
    })

    db.commit()
    db.refresh(txn)

    warnings: list[str] = []
    if _to_decimal(entry.available) < Decimal("0"):
        warnings.append(
            f"Category {category_id} is overspent — available: {entry.available}"
        )
    return txn, warnings


def create_split_expense(db: Session, user_id: int, data: dict) -> tuple[Transaction, list[str]]:
    """
    Record a split expense: one transaction spanning multiple categories.
    Each split leg updates its own BudgetEntry atomically.
    """
    acc = _get_account(db, data["account_id"], user_id)
    total = _to_decimal(data["amount"])
    month = _period_month(data["transaction_date"])

    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        category_id=None,   # split parent has no single category
        type=TransactionType.expense,
        amount=total,
        note=data.get("note"),
        transaction_date=data["transaction_date"],
        reconcile_status=ReconcileStatus.uncleared,
        is_split=True,
    )
    db.add(txn)
    acc.current_balance = _to_decimal(acc.current_balance) - total
    db.flush()

    warnings: list[str] = []
    for split in data["splits"]:
        item_amount = _to_decimal(split["amount"])
        item_cat = split["category_id"]
        db.add(SplitItem(
            transaction_id=txn.id,
            category_id=item_cat,
            amount=item_amount,
            note=split.get("note"),
        ))
        entry = budget_service.update_activity(db, user_id, item_cat, month, -item_amount)
        if _to_decimal(entry.available) < Decimal("0"):
            warnings.append(
                f"Category {item_cat} is overspent — available: {entry.available}"
            )

    if data.get("tag_ids"):
        _attach_tags(db, txn, data["tag_ids"])

    _audit(db, user_id, AuditAction.create_transaction, txn.id, None, {
        "type": "split_expense", "amount": str(total),
        "splits": [{"category_id": s["category_id"], "amount": str(s["amount"])} for s in data["splits"]],
    })

    db.commit()
    db.refresh(txn)
    return txn, warnings


def create_transfer(db: Session, user_id: int, data: dict) -> Transaction:
    """Move funds between two accounts. No category or BudgetEntry involved."""
    src = _get_account(db, data["account_id"], user_id)
    dst = _get_account(db, data["target_account_id"], user_id)
    if src.id == dst.id:
        raise BadRequestError("Source and target account must be different")

    amount = _to_decimal(data["amount"])
    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        target_account_id=data["target_account_id"],
        type=TransactionType.transfer,
        amount=amount,
        note=data.get("note"),
        transaction_date=data["transaction_date"],
        reconcile_status=ReconcileStatus.uncleared,
        is_split=False,
    )
    db.add(txn)
    src.current_balance = _to_decimal(src.current_balance) - amount
    dst.current_balance = _to_decimal(dst.current_balance) + amount
    db.flush()

    _audit(db, user_id, AuditAction.create_transaction, txn.id, None, {
        "type": "transfer", "amount": str(amount),
        "from_account": data["account_id"], "to_account": data["target_account_id"],
    })

    db.commit()
    db.refresh(txn)
    return txn


# ── Read operations ────────────────────────────────────────────────────────────

def list_transactions(
    db: Session,
    user_id: int,
    type_filter: Optional[str],
    account_id: Optional[int],
    category_id: Optional[int],
    from_date: Optional[datetime],
    to_date: Optional[datetime],
    q_search: Optional[str],
    skip: int,
    limit: int,
) -> tuple[list[Transaction], int, Decimal]:
    """
    Returns (items, total_count, total_amount) where total_count and total_amount
    reflect all matching rows (before pagination) — used for US-F summary display.
    """
    q = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type_filter:
        q = q.filter(Transaction.type == type_filter)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if from_date:
        q = q.filter(Transaction.transaction_date >= from_date.replace(hour=0, minute=0, second=0, microsecond=0))
    if to_date:
        q = q.filter(Transaction.transaction_date <= to_date.replace(hour=23, minute=59, second=59, microsecond=999999))
    if q_search:
        q = q.filter(Transaction.note.ilike(f"%{q_search}%"))

    total_count: int = q.count()
    raw_sum = q.with_entities(func.sum(Transaction.amount)).scalar()
    total_amount: Decimal = _to_decimal(raw_sum) if raw_sum is not None else Decimal("0")

    items = q.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    return items, total_count, total_amount


def get_transaction(db: Session, txn_id: int, user_id: int) -> Transaction:
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise NotFoundError("Transaction not found")
    if txn.user_id != user_id:
        raise ForbiddenError()
    return txn


# ── Update operation ───────────────────────────────────────────────────────────

def update_transaction(
    db: Session, txn_id: int, user_id: int, data: dict
) -> tuple[Transaction, list[str]]:
    """
    Update a non-reconciled transaction.
    If amount, category, or date changes on an expense, the BudgetEntry activity
    is reversed and re-applied atomically.
    """
    txn = get_transaction(db, txn_id, user_id)
    _check_not_reconciled(txn)

    if txn.is_split:
        raise BadRequestError(
            "Split transactions cannot be edited individually. Delete and recreate."
        )

    old_amount = _to_decimal(txn.amount)
    old_cat = txn.category_id
    old_date = txn.transaction_date
    old_month = _period_month(old_date)

    new_amount = _to_decimal(data["amount"]) if data.get("amount") is not None else old_amount
    new_cat = data.get("category_id") or old_cat
    new_date = data.get("transaction_date") or old_date
    new_month = _period_month(new_date)

    warnings: list[str] = []
    before_snap = {
        "amount": str(old_amount), "category_id": old_cat,
        "transaction_date": str(old_date), "note": txn.note,
    }

    if txn.type == TransactionType.expense:
        amount_changed = new_amount != old_amount
        cat_changed = new_cat != old_cat
        month_changed = new_month != old_month

        if amount_changed or cat_changed or month_changed:
            # Reverse old BudgetEntry impact (+old_amount restores the previous deduction)
            budget_service.update_activity(db, user_id, old_cat, old_month, old_amount)
            # Apply new BudgetEntry impact
            entry = budget_service.update_activity(db, user_id, new_cat, new_month, -new_amount)
            if _to_decimal(entry.available) < Decimal("0"):
                warnings.append(
                    f"Category {new_cat} is overspent — available: {entry.available}"
                )

        if amount_changed:
            acc = db.query(Account).filter(Account.id == txn.account_id).first()
            if acc:
                # old_amount > new_amount → refund the difference; reverse otherwise
                acc.current_balance = _to_decimal(acc.current_balance) + (old_amount - new_amount)

    elif txn.type == TransactionType.income:
        if data.get("amount") is not None and new_amount != old_amount:
            acc = db.query(Account).filter(Account.id == txn.account_id).first()
            if acc:
                acc.current_balance = _to_decimal(acc.current_balance) + (new_amount - old_amount)

    elif txn.type == TransactionType.transfer:
        if data.get("amount") is not None and new_amount != old_amount:
            src = db.query(Account).filter(Account.id == txn.account_id).first()
            dst = db.query(Account).filter(Account.id == txn.target_account_id).first()
            if src and dst:
                diff = new_amount - old_amount
                src.current_balance = _to_decimal(src.current_balance) - diff
                dst.current_balance = _to_decimal(dst.current_balance) + diff

    for k, v in data.items():
        if k != "tag_ids" and v is not None:
            setattr(txn, k, v)
    db.flush()

    if "tag_ids" in data and data["tag_ids"] is not None:
        _attach_tags(db, txn, data["tag_ids"])

    _audit(db, user_id, AuditAction.update_transaction, txn.id, before_snap, {
        "amount": str(new_amount), "category_id": new_cat,
        "transaction_date": str(new_date), "note": data.get("note"),
    })

    db.commit()
    db.refresh(txn)
    return txn, warnings


# ── Delete operation ───────────────────────────────────────────────────────────

def delete_transaction(db: Session, txn_id: int, user_id: int) -> None:
    """
    Delete a non-reconciled transaction.
    Reverses account balance and BudgetEntry activity atomically.
    """
    txn = get_transaction(db, txn_id, user_id)
    _check_not_reconciled(txn)

    amount = _to_decimal(txn.amount)
    month = _period_month(txn.transaction_date)

    # Reverse account balance
    acc = db.query(Account).filter(Account.id == txn.account_id).first()
    if acc:
        if txn.type == TransactionType.income:
            acc.current_balance = _to_decimal(acc.current_balance) - amount
        elif txn.type == TransactionType.expense:
            acc.current_balance = _to_decimal(acc.current_balance) + amount
        elif txn.type == TransactionType.transfer and txn.target_account_id:
            dst = db.query(Account).filter(Account.id == txn.target_account_id).first()
            if dst:
                acc.current_balance = _to_decimal(acc.current_balance) + amount
                dst.current_balance = _to_decimal(dst.current_balance) - amount

    # Reverse BudgetEntry activity for expenses
    if txn.type == TransactionType.expense:
        if txn.is_split:
            splits = db.query(SplitItem).filter(SplitItem.transaction_id == txn.id).all()
            for split in splits:
                if split.category_id:
                    budget_service.update_activity(
                        db, user_id, split.category_id, month, _to_decimal(split.amount)
                    )
        elif txn.category_id:
            budget_service.update_activity(db, user_id, txn.category_id, month, amount)

    _audit(db, user_id, AuditAction.delete_transaction, txn.id, {
        "type": str(txn.type), "amount": str(amount),
        "category_id": txn.category_id, "period_month": month,
    }, None)

    db.query(TransactionTag).filter(TransactionTag.transaction_id == txn.id).delete()
    db.query(SplitItem).filter(SplitItem.transaction_id == txn.id).delete()
    db.delete(txn)
    db.commit()


# ── Reconciliation ─────────────────────────────────────────────────────────────

def update_reconcile_status(
    db: Session, txn_id: int, user_id: int, status: ReconcileStatus
) -> Transaction:
    """
    Progress reconcile status: uncleared → cleared → reconciled.
    Once reconciled, the transaction becomes immutable.
    """
    txn = get_transaction(db, txn_id, user_id)

    if txn.reconcile_status == ReconcileStatus.reconciled:
        raise BadRequestError("Transaction is already reconciled")

    valid_transitions: dict[ReconcileStatus, list[ReconcileStatus]] = {
        ReconcileStatus.uncleared: [ReconcileStatus.cleared],
        ReconcileStatus.cleared: [ReconcileStatus.reconciled, ReconcileStatus.uncleared],
    }
    allowed = valid_transitions.get(txn.reconcile_status, [])
    if status not in allowed:
        raise BadRequestError(
            f"Cannot transition from '{txn.reconcile_status}' to '{status}'"
        )

    txn.reconcile_status = status
    db.commit()
    db.refresh(txn)
    return txn
