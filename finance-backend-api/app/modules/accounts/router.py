from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.accounts import service
from app.modules.accounts.schemas import AccountCreate, AccountOut

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountOut])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_accounts(db, current_user.id)

@router.post("", response_model=AccountOut, status_code=201)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_account(db, current_user.id, body.model_dump())

@router.delete("/{account_id}", status_code=204)
def deactivate_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.deactivate_account(db, account_id, current_user.id)
