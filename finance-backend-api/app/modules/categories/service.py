from sqlalchemy.orm import Session
from app.modules.categories.models import Category, Subcategory, Tag
from app.core.exceptions import NotFoundError, ForbiddenError


# ── Categories ────────────────────────────────────────────────────────────────

def create_category(db: Session, user_id: int, data: dict) -> Category:
    cat = Category(user_id=user_id, **data)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def list_categories(db: Session, user_id: int, type_filter: str | None) -> list[Category]:
    q = db.query(Category).filter(Category.user_id == user_id)
    if type_filter:
        q = q.filter(Category.type == type_filter)
    return q.all()


def update_category(db: Session, cat_id: int, user_id: int, data: dict) -> Category:
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    if cat.user_id != user_id:
        raise ForbiddenError()
    for k, v in data.items():
        if v is not None:
            setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, cat_id: int, user_id: int) -> None:
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    if cat.user_id != user_id:
        raise ForbiddenError()
    db.delete(cat)
    db.commit()


# ── Subcategories ─────────────────────────────────────────────────────────────

def create_subcategory(db: Session, user_id: int, category_id: int, name: str) -> Subcategory:
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    sub = Subcategory(category_id=category_id, name=name)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def list_subcategories(db: Session, user_id: int, category_id: int | None) -> list[Subcategory]:
    q = (
        db.query(Subcategory)
        .join(Category, Subcategory.category_id == Category.id)
        .filter(Category.user_id == user_id)
    )
    if category_id:
        q = q.filter(Subcategory.category_id == category_id)
    return q.all()


# ── Tags ──────────────────────────────────────────────────────────────────────

def create_tag(db: Session, user_id: int, name: str) -> Tag:
    tag = Tag(user_id=user_id, name=name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def list_tags(db: Session, user_id: int) -> list[Tag]:
    return db.query(Tag).filter(Tag.user_id == user_id).all()
