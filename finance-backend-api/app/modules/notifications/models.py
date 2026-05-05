import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    Enum as SAEnum, ForeignKey, UniqueConstraint, Date, func,
)
from app.db.base import Base


class NotificationType(str, enum.Enum):
    recurring_due = "recurring_due"
    recent_transaction = "recent_transaction"
    savings_no_deposit = "savings_no_deposit"
    savings_deadline = "savings_deadline"


class ReminderFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    once = "once"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SAEnum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    related_id = Column(Integer, nullable=True)
    dedup_key = Column(String(120), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "dedup_key", name="uq_notification_dedup"),
    )


class CustomReminder(Base):
    __tablename__ = "custom_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    frequency = Column(SAEnum(ReminderFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    reminder_time = Column(String(5), nullable=True)  # HH:MM
    note = Column(Text, nullable=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    next_trigger_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
