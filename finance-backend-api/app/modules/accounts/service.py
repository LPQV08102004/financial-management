from decimal import Decimal
from sqlalchemy.orm import Session
from app.modules.accounts.models import Account
from app.core.exceptions import NotFoundError, ForbiddenError

def list_accounts(db: Session, user_id: int) -> list[Account]:
    return (
        db.query(Account)
        .filter(Account.user_id == user_id, Account.is_active == True)
        .order_by(Account.id)
        .all()
    )

def create_account(db: Session, user_id: int, data: dict) -> Account:
    account = Account(
        user_id=user_id,
        name=data["name"],
        type=data["type"],
        current_balance=data.get("current_balance", Decimal("0")),
        note=data.get("note"),
        currency=data.get("currency", "VND"),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

def get_account(db: Session, account_id: int, user_id: int) -> Account:
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise NotFoundError("Account not found")
    if account.user_id != user_id:
        raise ForbiddenError()
    return account

def deactivate_account(db: Session, account_id: int, user_id: int) -> None:
    account = get_account(db, account_id, user_id)
    account.is_active = False
    db.commit()
