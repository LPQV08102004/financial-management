from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, Boolean, Text, Enum, func, ForeignKey, UniqueConstraint,
)
from app.db.base import Base
from app.shared.enums import AuditAction


class BudgetEntry(Base):
    """
    YNAB-style monthly budget entry for one category in one month.
    available = budgeted + activity  (always kept in sync)
    """
    __tablename__ = "budget_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    period_month = Column(String(7), nullable=False)   # YYYY-MM
    budgeted = Column(Numeric(15, 2), nullable=False, default=0)   # manually assigned amount
    activity = Column(Numeric(15, 2), nullable=False, default=0)   # sum of transactions (negative = expenses)
    available = Column(Numeric(15, 2), nullable=False, default=0)  # budgeted + activity
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "period_month", name="uq_budget_entry"),
    )


class BudgetAlert(Base):
    __tablename__ = "budget_alerts"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("budget_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_percent = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    triggered_at = Column(DateTime, server_default=func.now(), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)


class AuditLog(Base):
    """Immutable audit trail for all financial operations."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(Enum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=False)   # "budget_entry" | "transaction"
    entity_id = Column(Integer, nullable=False)
    before_data = Column(Text, nullable=True)           # JSON string
    after_data = Column(Text, nullable=True)            # JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
