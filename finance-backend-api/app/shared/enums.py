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
