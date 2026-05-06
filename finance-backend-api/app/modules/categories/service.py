from sqlalchemy.orm import Session
from app.modules.categories.models import Category, CategoryGroup, Subcategory, Tag
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.shared.enums import CategoryType


# ── Default category seed ──────────────────────────────────────────────────────

_DEFAULT_CATEGORIES = [
    {
        "group": "Chi tiêu thiết yếu",
        "sort_order": 0,
        "type": CategoryType.expense,
        "items": [
            {"name": "Ăn uống",          "icon": "fast-food",      "color": "#FF6B6B"},
            {"name": "Nhà ở",             "icon": "home",            "color": "#4ECDC4"},
            {"name": "Di chuyển",         "icon": "car",             "color": "#45B7D1"},
            {"name": "Sức khỏe",          "icon": "medical",         "color": "#96CEB4"},
            {"name": "Mua sắm",           "icon": "cart",            "color": "#FFEAA7"},
        ],
    },
    {
        "group": "Giải trí & Phong cách sống",
        "sort_order": 1,
        "type": CategoryType.expense,
        "items": [
            {"name": "Giải trí",          "icon": "film",            "color": "#DDA0DD"},
            {"name": "Cafe & Đồ uống",    "icon": "cafe",            "color": "#A0522D"},
            {"name": "Giáo dục",          "icon": "book",            "color": "#6C5CE7"},
            {"name": "Thể thao",          "icon": "football",        "color": "#00B894"},
            {"name": "Du lịch",           "icon": "airplane",        "color": "#74B9FF"},
        ],
    },
    {
        "group": "Hóa đơn & Tiện ích",
        "sort_order": 2,
        "type": CategoryType.expense,
        "items": [
            {"name": "Điện & Nước",           "icon": "bulb",            "color": "#FD79A8"},
            {"name": "Internet & Điện thoại", "icon": "phone-portrait",  "color": "#55EFC4"},
            {"name": "Bảo hiểm",              "icon": "shield",          "color": "#FDCB6E"},
        ],
    },
    {
        "group": "Chi phí khác",
        "sort_order": 3,
        "type": CategoryType.expense,
        "items": [
            {"name": "Khác", "icon": "ellipsis-horizontal", "color": "#B2BEC3"},
        ],
    },
    {
        "group": "Thu nhập",
        "sort_order": 4,
        "type": CategoryType.income,
        "items": [
            {"name": "Lương",         "icon": "briefcase",       "color": "#00B894"},
            {"name": "Thưởng",        "icon": "trophy",          "color": "#FDCB6E"},
            {"name": "Quà tặng",      "icon": "gift",            "color": "#E17055"},
            {"name": "Đầu tư",        "icon": "trending-up",     "color": "#6C5CE7"},
            {"name": "Thu nhập phụ",  "icon": "cash",            "color": "#00CEC9"},
            {"name": "Khác",          "icon": "ellipsis-horizontal", "color": "#B2BEC3"},
        ],
    },
]


def seed_default_categories(db: Session, user_id: int) -> None:
    """Create default category groups/categories for a new user using DB templates."""
    from app.modules.admin.models import DefaultCategoryTemplate
    templates = (
        db.query(DefaultCategoryTemplate)
        .filter(DefaultCategoryTemplate.is_active == True)
        .order_by(DefaultCategoryTemplate.group_sort_order, DefaultCategoryTemplate.id)
        .all()
    )

    # Fall back to hardcoded list if DB has no templates yet
    if not templates:
        _seed_from_hardcoded(db, user_id)
        return

    # Group by group_name
    groups: dict = {}
    for t in templates:
        if t.group_name not in groups:
            groups[t.group_name] = {"sort_order": t.group_sort_order, "items": []}
        groups[t.group_name]["items"].append(t)

    for group_name, gdata in groups.items():
        group = CategoryGroup(
            user_id=user_id, name=group_name,
            sort_order=gdata["sort_order"], is_system=True,
        )
        db.add(group)
        db.flush()
        for t in gdata["items"]:
            db.add(Category(
                user_id=user_id, group_id=group.id,
                name=t.name, type=t.type, icon=t.icon, color=t.color, is_active=True,
            ))
    db.commit()


def _seed_from_hardcoded(db: Session, user_id: int) -> None:
    """Fallback: use the hardcoded list (used before DB templates are seeded)."""
    for group_def in _DEFAULT_CATEGORIES:
        group = CategoryGroup(
            user_id=user_id,
            name=group_def["group"],
            sort_order=group_def["sort_order"],
            is_system=True,
        )
        db.add(group)
        db.flush()
        for item in group_def["items"]:
            db.add(Category(
                user_id=user_id,
                group_id=group.id,
                name=item["name"],
                type=group_def["type"],
                icon=item["icon"],
                color=item["color"],
                is_active=True,
            ))
    db.commit()


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
    """Name, color, icon, and group_id are mutable. Type is immutable after creation."""
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == user_id).first()
    if not cat:
        raise NotFoundError("Category not found")
    if not cat.is_active:
        raise BadRequestError("Cannot update an inactive category")
    if "type" in data:
        raise BadRequestError("Category type is immutable after creation")

    allowed = {"name", "color", "icon", "group_id"}
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
