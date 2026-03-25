from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.modules.transactions.models import Transaction
from app.modules.categories.models import TransactionTag
from app.modules.accounts.models import Account
from app.shared.enums import TransactionType
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


def _get_account(db: Session, account_id: int, user_id: int) -> Account:
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not acc:
        raise NotFoundError(f"Account {account_id} not found")
    return acc


def _attach_tags(db: Session, transaction: Transaction, tag_ids: list[int]) -> None:
    # Remove existing tags
    db.query(TransactionTag).filter(TransactionTag.transaction_id == transaction.id).delete()
    for tag_id in tag_ids:
        db.add(TransactionTag(transaction_id=transaction.id, tag_id=tag_id))


def create_income(db: Session, user_id: int, data: dict) -> Transaction:
    acc = _get_account(db, data["account_id"], user_id)
    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        category_id=data.get("category_id"),
        subcategory_id=data.get("subcategory_id"),
        type=TransactionType.income,
        amount=data["amount"],
        note=data.get("note"),
        transaction_date=data["transaction_date"],
    )
    db.add(txn)
    acc.current_balance = Decimal(str(acc.current_balance)) + Decimal(str(data["amount"]))
    db.flush()
    if data.get("tag_ids"):
        _attach_tags(db, txn, data["tag_ids"])
    db.commit()
    db.refresh(txn)
    return txn


def create_expense(db: Session, user_id: int, data: dict) -> Transaction:
    acc = _get_account(db, data["account_id"], user_id)
    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        category_id=data.get("category_id"),
        subcategory_id=data.get("subcategory_id"),
        type=TransactionType.expense,
        amount=data["amount"],
        note=data.get("note"),
        transaction_date=data["transaction_date"],
    )
    db.add(txn)
    acc.current_balance = Decimal(str(acc.current_balance)) - Decimal(str(data["amount"]))
    db.flush()
    if data.get("tag_ids"):
        _attach_tags(db, txn, data["tag_ids"])
    db.commit()
    db.refresh(txn)
    return txn


def create_transfer(db: Session, user_id: int, data: dict) -> Transaction:
    src = _get_account(db, data["account_id"], user_id)
    dst = _get_account(db, data["target_account_id"], user_id)
    if src.id == dst.id:
        raise BadRequestError("Source and target account must be different")
    txn = Transaction(
        user_id=user_id,
        account_id=data["account_id"],
        target_account_id=data["target_account_id"],
        type=TransactionType.transfer,
        amount=data["amount"],
        note=data.get("note"),
        transaction_date=data["transaction_date"],
    )
    db.add(txn)
    amount = Decimal(str(data["amount"]))
    src.current_balance = Decimal(str(src.current_balance)) - amount
    dst.current_balance = Decimal(str(dst.current_balance)) + amount
    db.commit()
    db.refresh(txn)
    return txn


def list_transactions(
    db: Session,
    user_id: int,
    type_filter: Optional[str],
    account_id: Optional[int],
    from_date: Optional[datetime],
    to_date: Optional[datetime],
    skip: int,
    limit: int,
) -> list[Transaction]:
    q = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type_filter:
        q = q.filter(Transaction.type == type_filter)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if from_date:
        q = q.filter(Transaction.transaction_date >= from_date)
    if to_date:
        q = q.filter(Transaction.transaction_date <= to_date)
    return q.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()


def get_transaction(db: Session, txn_id: int, user_id: int) -> Transaction:
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise NotFoundError("Transaction not found")
    if txn.user_id != user_id:
        raise ForbiddenError()
    return txn


def update_transaction(db: Session, txn_id: int, user_id: int, data: dict) -> Transaction:
    txn = get_transaction(db, txn_id, user_id)
    if "amount" in data and data["amount"] is not None:
        # Reverse old balance effect and apply new
        diff = Decimal(str(data["amount"])) - Decimal(str(txn.amount))
        acc = db.query(Account).filter(Account.id == txn.account_id).first()
        if acc:
            if txn.type == TransactionType.income:
                acc.current_balance = Decimal(str(acc.current_balance)) + diff
            elif txn.type == TransactionType.expense:
                acc.current_balance = Decimal(str(acc.current_balance)) - diff
    for k, v in data.items():
        if k != "tag_ids" and v is not None:
            setattr(txn, k, v)
    db.flush()
    if "tag_ids" in data and data["tag_ids"] is not None:
        _attach_tags(db, txn, data["tag_ids"])
    db.commit()
    db.refresh(txn)
    return txn


def delete_transaction(db: Session, txn_id: int, user_id: int) -> None:
    txn = get_transaction(db, txn_id, user_id)
    # Reverse balance effect
    acc = db.query(Account).filter(Account.id == txn.account_id).first()
    if acc:
        amount = Decimal(str(txn.amount))
        if txn.type == TransactionType.income:
            acc.current_balance = Decimal(str(acc.current_balance)) - amount
        elif txn.type == TransactionType.expense:
            acc.current_balance = Decimal(str(acc.current_balance)) + amount
        elif txn.type == TransactionType.transfer and txn.target_account_id:
            dst = db.query(Account).filter(Account.id == txn.target_account_id).first()
            if dst:
                acc.current_balance = Decimal(str(acc.current_balance)) + amount
                dst.current_balance = Decimal(str(dst.current_balance)) - amount
    db.query(TransactionTag).filter(TransactionTag.transaction_id == txn.id).delete()
    db.delete(txn)
    db.commit()
