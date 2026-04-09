from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.recurring import service
from app.modules.recurring.schemas import (
    RecurringTemplateCreate,
    RecurringTemplateUpdate,
    RecurringTemplateOut,
    UpcomingListResponse,
    GenerateResult,
)

router = APIRouter(prefix="/recurring", tags=["Recurring Transactions"])


@router.get("", response_model=List[RecurringTemplateOut])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active recurring templates for the current user."""
    return service.list_templates(db, current_user.id)


@router.post("", response_model=RecurringTemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    body: RecurringTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new recurring transaction template."""
    return service.create_template(db, current_user.id, body.model_dump())


@router.get("/upcoming", response_model=UpcomingListResponse)
def get_upcoming(
    days: int = Query(default=30, ge=1, le=90, description="Look-ahead window in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all projected occurrences within the next N days (default 30)."""
    return service.get_upcoming(db, current_user.id, days)


@router.post("/process", response_model=GenerateResult)
def process_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate all overdue transactions across every active template.
    Call this on app start or once per day.
    """
    return service.process_all_due(db, current_user.id)


@router.get("/{template_id}", response_model=RecurringTemplateOut)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_template(db, template_id, current_user.id)


@router.patch("/{template_id}", response_model=RecurringTemplateOut)
def update_template(
    template_id: int,
    body: RecurringTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit a template. Changes apply from the next run, not retroactively."""
    return service.update_template(
        db, template_id, current_user.id, body.model_dump(exclude_none=True)
    )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stop a recurring template (soft-delete)."""
    service.delete_template(db, template_id, current_user.id)


@router.post("/{template_id}/generate", response_model=GenerateResult)
def generate_due(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually generate all overdue transactions for one template."""
    return service.generate_due(db, template_id, current_user.id)
