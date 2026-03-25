from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.shared.enums import CategoryType


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    type: CategoryType
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: CategoryType
    color: Optional[str]
    icon: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Subcategory ───────────────────────────────────────────────────────────────

class SubcategoryCreate(BaseModel):
    category_id: int
    name: str


class SubcategoryOut(BaseModel):
    id: int
    category_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Tag ───────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
