from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, Text, Boolean, ForeignKey, func

from app.db.base import Base
from app.shared.enums import AccountType

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(Enum(AccountType), nullable=False)
    current_balance = Column(Numeric(15, 2), nullable=False, default=0)
    note = Column(Text, nullable=True)
    currency = Column(String(10), nullable=False, default="VND")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
