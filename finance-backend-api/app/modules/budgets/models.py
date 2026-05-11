from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, Boolean, Text, Enum, func, ForeignKey, UniqueConstraint,
)
from app.db.base import Base
from app.shared.enums import AuditAction

class BudgetEntry(Base):
    __tablename__ = "budget_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    period_month = Column(String(7), nullable=False)
    budgeted = Column(Numeric(15, 2), nullable=False, default=0)
    activity = Column(Numeric(15, 2), nullable=False, default=0)
    available = Column(Numeric(15, 2), nullable=False, default=0)
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
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(Enum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    before_data = Column(Text, nullable=True)
    after_data = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
