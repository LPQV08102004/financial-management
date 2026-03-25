from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic can detect them for autogenerate
from app.modules.auth.models import User, RefreshToken  # noqa: F401, E402
from app.modules.accounts.models import Account  # noqa: F401, E402
from app.modules.categories.models import Category, Subcategory, Tag, TransactionTag  # noqa: F401, E402
from app.modules.transactions.models import Transaction  # noqa: F401, E402
from app.modules.budgets.models import Budget, BudgetAlert  # noqa: F401, E402
