from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

from app.modules.notifications.models import NotificationType, ReminderFrequency


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    display_type: str  # savings | recurring | reminder — dùng cho frontend filter
    title: str
    content: Optional[str]
    related_id: Optional[int]
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    unread_count: int


class UnreadCountOut(BaseModel):
    unread_count: int


class GenerateResult(BaseModel):
    generated: int


class MarkAllReadResult(BaseModel):
    marked_read: int


# ── Custom Reminder schemas ────────────────────────────────────────────────────

class CustomReminderCreate(BaseModel):
    name: str
    frequency: ReminderFrequency
    start_date: date
    reminder_time: Optional[str] = None  # HH:MM
    note: Optional[str] = None


class CustomReminderUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[ReminderFrequency] = None
    start_date: Optional[date] = None
    reminder_time: Optional[str] = None
    note: Optional[str] = None
    is_enabled: Optional[bool] = None


class CustomReminderOut(BaseModel):
    id: int
    name: str
    frequency: ReminderFrequency
    start_date: date
    reminder_time: Optional[str]
    note: Optional[str]
    is_enabled: bool
    next_trigger_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}
