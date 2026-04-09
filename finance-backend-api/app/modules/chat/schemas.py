from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


# ── NLP Transaction Parsing ────────────────────────────────────────────────────

class ParseTransactionRequest(BaseModel):
    message: str


class CategorySuggestion(BaseModel):
    id: int
    name: str
    confidence: int   # 0-100


class ParseTransactionResponse(BaseModel):
    type: Optional[str] = None          # "expense" | "income" | null
    amount: Optional[float] = None
    date: Optional[str] = None          # ISO "YYYY-MM-DD"
    note: Optional[str] = None
    category_suggestions: List[CategorySuggestion] = []
    missing_fields: List[str] = []      # fields that could not be extracted


# ── NLP Savings Action Parsing ─────────────────────────────────────────────────

class ParseSavingsRequest(BaseModel):
    message: str


class GoalSuggestion(BaseModel):
    id: int
    name: str
    confidence: int   # 0-100


class ParseSavingsResponse(BaseModel):
    action: Optional[str] = None        # "deposit" | "withdraw"
    amount: Optional[float] = None
    date: Optional[str] = None          # ISO "YYYY-MM-DD"
    note: Optional[str] = None
    goal_suggestions: List[GoalSuggestion] = []
    missing_fields: List[str] = []
