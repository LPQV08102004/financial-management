from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.notifications import service
from app.modules.notifications.schemas import (
    NotificationOut, NotificationListOut, UnreadCountOut,
    GenerateResult, MarkAllReadResult,
    CustomReminderCreate, CustomReminderUpdate, CustomReminderOut,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])
reminders_router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.post("/generate", response_model=GenerateResult)
def generate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quét dữ liệu và sinh thông báo mới. Gọi khi mở màn hình thông báo."""
    count = service.generate_notifications(db, current_user.id)
    return GenerateResult(generated=count)


@router.get("", response_model=NotificationListOut)
def list_notifications(
    display_type: Optional[str] = Query(None, description="savings | recurring | reminder"),
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_notifications(db, current_user.id, display_type, unread_only, skip, limit)


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UnreadCountOut(unread_count=service.get_unread_count(db, current_user.id))


@router.patch("/read-all", response_model=MarkAllReadResult)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = service.mark_all_read(db, current_user.id)
    return MarkAllReadResult(marked_read=count)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.mark_read(db, current_user.id, notification_id)


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_notification(db, current_user.id, notification_id)
    return {"deleted": True}


# ── Reminders ─────────────────────────────────────────────────────────────────

@reminders_router.get("", response_model=list[CustomReminderOut])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_reminders(db, current_user.id)


@reminders_router.post("", response_model=CustomReminderOut, status_code=201)
def create_reminder(
    body: CustomReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_reminder(db, current_user.id, body)


@reminders_router.patch("/{reminder_id}", response_model=CustomReminderOut)
def update_reminder(
    reminder_id: int,
    body: CustomReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_reminder(db, current_user.id, reminder_id, body)


@reminders_router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_reminder(db, current_user.id, reminder_id)
    return {"deleted": True}
