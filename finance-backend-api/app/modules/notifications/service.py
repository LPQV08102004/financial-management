from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.modules.notifications.models import (
    Notification, CustomReminder, NotificationType, ReminderFrequency,
)
from app.modules.notifications.schemas import (
    NotificationOut, NotificationListOut,
    CustomReminderCreate, CustomReminderUpdate, CustomReminderOut,
)
from app.modules.recurring.models import RecurringTemplate
from app.modules.savings_goals.models import SavingsGoal
from app.modules.transactions.models import Transaction
from app.shared.enums import TransactionType

_DISPLAY_TYPE_MAP = {
    NotificationType.recurring_due: "recurring",
    NotificationType.recent_transaction: "reminder",
    NotificationType.savings_no_deposit: "savings",
    NotificationType.savings_deadline: "savings",
    NotificationType.custom_reminder_due: "reminder",
}

_FILTER_TO_TYPES = {
    "recurring": [NotificationType.recurring_due],
    "savings": [NotificationType.savings_no_deposit, NotificationType.savings_deadline],
    "reminder": [NotificationType.recent_transaction, NotificationType.custom_reminder_due],
}

def _to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        type=n.type,
        display_type=_DISPLAY_TYPE_MAP[n.type],
        title=n.title,
        content=n.content,
        related_id=n.related_id,
        is_read=n.is_read,
        created_at=n.created_at,
    )

def _try_insert(
    db: Session,
    user_id: int,
    ntype: NotificationType,
    title: str,
    content: str,
    related_id: Optional[int],
    dedup_key: str,
) -> bool:
    exists = db.query(Notification.id).filter(
        Notification.user_id == user_id,
        Notification.dedup_key == dedup_key,
    ).first()
    if exists:
        return False
    db.add(Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        content=content,
        related_id=related_id,
        dedup_key=dedup_key,
    ))
    return True

def generate_notifications(db: Session, user_id: int) -> int:
    today = date.today()
    created = 0

    due_limit = today + timedelta(days=2)
    due_templates = db.query(RecurringTemplate).filter(
        RecurringTemplate.user_id == user_id,
        RecurringTemplate.is_active == True,
        RecurringTemplate.next_run_date >= today,
        RecurringTemplate.next_run_date <= due_limit,
    ).all()

    for r in due_templates:
        days_left = (r.next_run_date - today).days
        day_str = "hôm nay" if days_left == 0 else ("ngày mai" if days_left == 1 else f"trong {days_left} ngày")
        type_label = "Thu nhập" if r.type.value == "income" else "Chi tiêu"
        amount = Decimal(str(r.amount))
        dedup = f"recurring_{r.id}_{r.next_run_date.isoformat()}"
        if _try_insert(
            db, user_id,
            NotificationType.recurring_due,
            f"Giao dịch định kỳ: {r.name}",
            f"{type_label} định kỳ '{r.name}' ({amount:,.0f} đ) đến hạn {day_str}.",
            r.id, dedup,
        ):
            created += 1

    since = datetime.now() - timedelta(hours=24)
    recent = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.created_at >= since,
        Transaction.type.in_([TransactionType.income, TransactionType.expense]),
    ).all()

    if recent:
        dedup = f"recent_tx_{today.isoformat()}"
        income_total = sum(Decimal(str(t.amount)) for t in recent if t.type == TransactionType.income)
        expense_total = sum(Decimal(str(t.amount)) for t in recent if t.type == TransactionType.expense)
        parts = []
        if income_total > 0:
            parts.append(f"thu {income_total:,.0f} đ")
        if expense_total > 0:
            parts.append(f"chi {expense_total:,.0f} đ")
        summary = ", ".join(parts)
        if _try_insert(
            db, user_id,
            NotificationType.recent_transaction,
            "Tổng kết giao dịch hôm qua",
            f"Bạn có {len(recent)} giao dịch trong 24 giờ qua: {summary}.",
            None, dedup,
        ):
            created += 1

    week_ago = datetime.now() - timedelta(days=7)
    iso_week = today.isocalendar()[1]
    stale_goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active == True,
        SavingsGoal.saved_amount < SavingsGoal.target_amount,
        SavingsGoal.deadline >= today,
        SavingsGoal.updated_at <= week_ago,
    ).all()

    for g in stale_goals:
        dedup = f"savings_nodeposit_{g.id}_{today.year}W{iso_week}"
        remaining = Decimal(str(g.target_amount)) - Decimal(str(g.saved_amount))
        if _try_insert(
            db, user_id,
            NotificationType.savings_no_deposit,
            f"Mục tiêu tiết kiệm: {g.name}",
            f"Bạn chưa nạp tiền vào '{g.name}' trong 7 ngày qua. Còn thiếu {remaining:,.0f} đ.",
            g.id, dedup,
        ):
            created += 1

    deadline_limit = today + timedelta(days=7)
    near_deadline = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id,
        SavingsGoal.is_active == True,
        SavingsGoal.saved_amount < SavingsGoal.target_amount,
        SavingsGoal.deadline >= today,
        SavingsGoal.deadline <= deadline_limit,
    ).all()

    for g in near_deadline:
        days_left = (g.deadline - today).days
        dedup = f"savings_deadline_{g.id}_{g.deadline.isoformat()}"
        remaining = Decimal(str(g.target_amount)) - Decimal(str(g.saved_amount))
        if _try_insert(
            db, user_id,
            NotificationType.savings_deadline,
            f"Sắp đến hạn: {g.name}",
            f"Mục tiêu '{g.name}' còn {days_left} ngày. Bạn còn thiếu {remaining:,.0f} đ.",
            g.id, dedup,
        ):
            created += 1

    due_reminders = db.query(CustomReminder).filter(
        CustomReminder.user_id == user_id,
        CustomReminder.is_enabled == True,
        CustomReminder.next_trigger_date != None,
        CustomReminder.next_trigger_date <= today,
    ).all()

    for r in due_reminders:
        dedup = f"custom_reminder_{r.id}_{r.next_trigger_date.isoformat()}"
        time_str = f" lúc {r.reminder_time}" if r.reminder_time else ""
        note_str = f" {r.note}" if r.note else ""
        if _try_insert(
            db, user_id,
            NotificationType.custom_reminder_due,
            f"Lời nhắc: {r.name}",
            f"Đến giờ nhắc nhở{time_str}: {r.name}.{note_str}",
            r.id, dedup,
        ):
            created += 1

        if r.frequency == ReminderFrequency.once:
            r.next_trigger_date = None
        else:
            r.next_trigger_date = _next_trigger(r.start_date, r.frequency)

    db.commit()
    return created

def list_notifications(
    db: Session,
    user_id: int,
    display_type: Optional[str] = None,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> NotificationListOut:
    q = db.query(Notification).filter(Notification.user_id == user_id)

    if display_type and display_type in _FILTER_TO_TYPES:
        q = q.filter(Notification.type.in_(_FILTER_TO_TYPES[display_type]))

    if unread_only:
        q = q.filter(Notification.is_read == False)

    unread_count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).scalar() or 0

    items = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return NotificationListOut(items=[_to_out(n) for n in items], unread_count=unread_count)

def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(func.count(Notification.id)).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).scalar() or 0

def mark_read(db: Session, user_id: int, notification_id: int) -> NotificationOut:
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if not n:
        raise NotFoundError("Không tìm thấy thông báo")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return _to_out(n)

def mark_all_read(db: Session, user_id: int) -> int:
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return count

def delete_notification(db: Session, user_id: int, notification_id: int) -> None:
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if not n:
        raise NotFoundError("Không tìm thấy thông báo")
    db.delete(n)
    db.commit()

def _next_trigger(start_date: date, frequency: ReminderFrequency) -> date:
    today = date.today()
    if start_date >= today:
        return start_date
    if frequency == ReminderFrequency.once:
        return start_date
    if frequency == ReminderFrequency.daily:
        return today + timedelta(days=1)
    if frequency == ReminderFrequency.weekly:
        days_elapsed = (today - start_date).days
        weeks_done = days_elapsed // 7
        return start_date + timedelta(weeks=weeks_done + 1)

    target_day = min(start_date.day, 28)
    candidate = date(today.year, today.month, target_day)
    if candidate <= today:
        if today.month == 12:
            candidate = date(today.year + 1, 1, target_day)
        else:
            candidate = date(today.year, today.month + 1, target_day)
    return candidate

def list_reminders(db: Session, user_id: int) -> list[CustomReminderOut]:
    rows = db.query(CustomReminder).filter(
        CustomReminder.user_id == user_id,
    ).order_by(CustomReminder.created_at.desc()).all()
    return [CustomReminderOut.model_validate(r) for r in rows]

def create_reminder(db: Session, user_id: int, payload: CustomReminderCreate) -> CustomReminderOut:
    reminder = CustomReminder(
        user_id=user_id,
        name=payload.name,
        frequency=payload.frequency,
        start_date=payload.start_date,
        reminder_time=payload.reminder_time,
        note=payload.note,
        next_trigger_date=_next_trigger(payload.start_date, payload.frequency),
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return CustomReminderOut.model_validate(reminder)

def update_reminder(
    db: Session, user_id: int, reminder_id: int, payload: CustomReminderUpdate
) -> CustomReminderOut:
    r = db.query(CustomReminder).filter(
        CustomReminder.id == reminder_id,
        CustomReminder.user_id == user_id,
    ).first()
    if not r:
        raise NotFoundError("Không tìm thấy lời nhắc")

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(r, field, value)

    if "start_date" in update_data or "frequency" in update_data:
        r.next_trigger_date = _next_trigger(r.start_date, r.frequency)

    db.commit()
    db.refresh(r)
    return CustomReminderOut.model_validate(r)

def delete_reminder(db: Session, user_id: int, reminder_id: int) -> None:
    r = db.query(CustomReminder).filter(
        CustomReminder.id == reminder_id,
        CustomReminder.user_id == user_id,
    ).first()
    if not r:
        raise NotFoundError("Không tìm thấy lời nhắc")
    db.delete(r)
    db.commit()
