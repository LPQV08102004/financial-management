from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from app.shared.enums import AccountType

class AccountCreate(BaseModel):
    name: str
    type: AccountType
    current_balance: Decimal = Decimal("0")
    note: Optional[str] = None
    currency: str = "VND"

class AccountOut(BaseModel):
    id: int
    name: str
    type: AccountType
    current_balance: Decimal
    note: Optional[str]
    currency: str
    is_active: bool

    model_config = {"from_attributes": True}
