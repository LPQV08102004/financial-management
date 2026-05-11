from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from app.modules.auth.models import User, RefreshToken
from app.modules.accounts.models import Account
from app.modules.categories.models import (
    CategoryGroup, Category, Subcategory, Tag, TransactionTag,
)
from app.modules.transactions.models import Transaction, SplitItem
from app.modules.budgets.models import BudgetEntry, BudgetAlert, AuditLog
from app.modules.savings_goals.models import SavingsGoal
from app.modules.recurring.models import RecurringTemplate
from app.modules.notifications.models import Notification, CustomReminder
from app.modules.admin.models import DefaultCategoryTemplate
