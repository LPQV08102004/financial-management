from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, func
from app.db.base import Base
from app.shared.enums import CategoryType


class DefaultCategoryTemplate(Base):
    __tablename__ = "default_category_templates"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), nullable=False)
    group_sort_order = Column(Integer, nullable=False, default=0)
    name = Column(String(100), nullable=False)
    type = Column(Enum(CategoryType), nullable=False)
    color = Column(String(20), nullable=True)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
