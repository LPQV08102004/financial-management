import calendar
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Boolean, Text, Enum, ForeignKey, func
from app.db.base import Base
from app.shared.enums import TransactionType, RecurringFrequency


class RecurringTemplate(Base):
    __tablename__ = "recurring_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)          # income | expense only
    amount = Column(Numeric(15, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    frequency = Column(Enum(RecurringFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)                        # None = no end
    next_run_date = Column(Date, nullable=False)                  # next date to generate
    note = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
