from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.shared.enums import CategoryType

class CategoryGroupCreate(BaseModel):
    name: str
    sort_order: int = 0

class CategoryGroupOut(BaseModel):
    id: int
    user_id: int
    name: str
    sort_order: int
    is_system: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class CategoryCreate(BaseModel):
    name: str
    type: CategoryType
    group_id: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    group_id: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    user_id: int
    group_id: Optional[int]
    name: str
    type: CategoryType
    color: Optional[str]
    icon: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class SubcategoryCreate(BaseModel):
    category_id: int
    name: str

class SubcategoryOut(BaseModel):
    id: int
    category_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}

class TagCreate(BaseModel):
    name: str

class TagOut(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
