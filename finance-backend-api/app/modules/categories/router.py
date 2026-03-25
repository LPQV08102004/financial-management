from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.categories import service
from app.modules.categories.schemas import (
    CategoryCreate, CategoryUpdate, CategoryOut,
    SubcategoryCreate, SubcategoryOut,
    TagCreate, TagOut,
)

router = APIRouter(tags=["Categories"])


# ── Category Routes ────────────────────────────────────────────────────────────

@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_category(db, current_user.id, body.model_dump())


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(
    type: Optional[str] = Query(None, description="income or expense"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_categories(db, current_user.id, type)


@router.patch("/categories/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_category(db, cat_id, current_user.id, body.model_dump(exclude_none=True))


@router.delete("/categories/{cat_id}", status_code=204)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_category(db, cat_id, current_user.id)


# ── Subcategory Routes ─────────────────────────────────────────────────────────

@router.post("/subcategories", response_model=SubcategoryOut, status_code=201)
def create_subcategory(
    body: SubcategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_subcategory(db, current_user.id, body.category_id, body.name)


@router.get("/subcategories", response_model=List[SubcategoryOut])
def list_subcategories(
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_subcategories(db, current_user.id, category_id)


# ── Tag Routes ─────────────────────────────────────────────────────────────────

@router.post("/tags", response_model=TagOut, status_code=201)
def create_tag(
    body: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_tag(db, current_user.id, body.name)


@router.get("/tags", response_model=List[TagOut])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_tags(db, current_user.id)
