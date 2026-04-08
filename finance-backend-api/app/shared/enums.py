import enum


class AccountType(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    e_wallet = "e_wallet"


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"


class CategoryType(str, enum.Enum):
    income = "income"
    expense = "expense"


class ReconcileStatus(str, enum.Enum):
    uncleared = "uncleared"
    cleared = "cleared"
    reconciled = "reconciled"


class GoalStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"


class AuditAction(str, enum.Enum):
    assign_budget = "assign_budget"
    move_money = "move_money"
    create_transaction = "create_transaction"
    update_transaction = "update_transaction"
    delete_transaction = "delete_transaction"
