from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic autogenerate can detect them
from app.modules.auth.models import User, RefreshToken  # noqa: F401, E402
from app.modules.accounts.models import Account  # noqa: F401, E402
from app.modules.categories.models import (  # noqa: F401, E402
    CategoryGroup, Category, Subcategory, Tag, TransactionTag,
)
from app.modules.transactions.models import Transaction, SplitItem  # noqa: F401, E402
from app.modules.budgets.models import BudgetEntry, BudgetAlert, AuditLog  # noqa: F401, E402
from app.modules.savings_goals.models import SavingsGoal  # noqa: F401, E402
from app.modules.recurring.models import RecurringTemplate  # noqa: F401, E402
