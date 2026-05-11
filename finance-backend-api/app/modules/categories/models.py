from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, Boolean, ForeignKey, func, PrimaryKeyConstraint,
)
from app.db.base import Base
from app.shared.enums import CategoryType

class CategoryGroup(Base):
    __tablename__ = "category_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_system = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("category_groups.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(Enum(CategoryType), nullable=False)
    color = Column(String(20), nullable=True)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class Subcategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("transaction_id", "tag_id"),
    )
