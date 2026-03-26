from sqlalchemy.orm import Session
from app.modules.categories.models import Category, CategoryGroup, Subcategory, Tag
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


# ── Category Groups ────────────────────────────────────────────────────────────

def create_group(db: Session, user_id: int, name: str, sort_order: int = 0) -> CategoryGroup:
    group = CategoryGroup(user_id=user_id, name=name, sort_order=sort_order, is_system=False)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def list_groups(db: Session, user_id: int) -> list[CategoryGroup]:
    return (
        db.query(CategoryGroup)
        .filter(CategoryGroup.user_id == user_id)
        .order_by(CategoryGroup.sort_order)
        .all()
    )


def delete_group(db: Session, group_id: int, user_id: int) -> None:
    group = (
        db.query(CategoryGroup)
        .filter(CategoryGroup.id == group_id, CategoryGroup.user_id == user_id)
        .first()
    )
    if not group:
        raise NotFoundError("Category group not found")
    if group.is_system:
        raise BadRequestError("System groups cannot be deleted")
    # Unlink categories from this group rather than cascading
    db.query(Category).filter(Category.group_id == group_id).update({"group_id": None})
    db.delete(group)
    db.commit()


# ── Categories ────────────────────────────────────────────────────────────────

def create_category(db: Session, user_id: int, data: dict) -> Category:
    if data.get("group_id"):
        group = (
            db.query(CategoryGroup)
            .filter(CategoryGroup.id == data["group_id"], CategoryGroup.user_id == user_id)
            .first()
        )
        if not group:
            raise NotFoundError("Category group not found")
    cat = Category(user_id=user_id, is_active=True, **data)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def list_categories(
    db: Session,
    user_id: int,
    type_filter: str | None,
    include_inactive: bool = False,
) -> list[Category]:
    q = db.query(Category).filter(Category.user_id == user_id)
    if not include_inactive:
        q = q.filter(Category.is_active == True)  # noqa: E712
    if type_filter:
        q = q.filter(Category.type == type_filter)
    return q.all()


def update_category(db: Session, cat_id: int, user_id: int, data: dict) -> Category:
    """Only color, icon, and group_id are mutable. Name and type are immutable."""
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == user_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    if not cat.is_active:
        raise BadRequestError("Cannot update an inactive category")
    if "name" in data or "type" in data:
        raise BadRequestError("Category name and type are immutable after creation")

    allowed = {"color", "icon", "group_id"}
    for k, v in data.items():
        if k in allowed:
            if k == "group_id" and v is not None:
                group = (
                    db.query(CategoryGroup)
                    .filter(CategoryGroup.id == v, CategoryGroup.user_id == user_id)
                    .first()
                )
                if not group:
                    raise NotFoundError("Category group not found")
            setattr(cat, k, v)

    db.commit()
    db.refresh(cat)
    return cat


def deactivate_category(db: Session, cat_id: int, user_id: int) -> None:
    """Soft-delete: mark category as inactive."""
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == user_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    cat.is_active = False
    db.commit()


# ── Subcategories ─────────────────────────────────────────────────────────────

def create_subcategory(db: Session, user_id: int, category_id: int, name: str) -> Subcategory:
    cat = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id, Category.is_active == True)  # noqa: E712
        .first()
    )
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
