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


# ── OCR Receipt Parsing ────────────────────────────────────────────────────────

class ReceiptOCRRequest(BaseModel):
    image_base64: str           # Base64 encoded JPG/PNG (no data URI prefix)
    hint: Optional[str] = None  # Optional store-type hint (e.g. "restaurant")


class ReceiptItem(BaseModel):
    name: str
    qty: Optional[float] = None          # quantity
    price: Optional[float] = None        # unit price or line total


class OCRReceiptResponse(BaseModel):
    amount: Optional[float] = None
    merchant_name: Optional[str] = None
    date: Optional[str] = None           # YYYY-MM-DD
    raw_text: str = ""                   # Full extracted text for transparency
    type: str = "expense"
    note: Optional[str] = None
    items: List[ReceiptItem] = []        # line items extracted from receipt
    category_suggestions: List[CategorySuggestion] = []
    confidence_level: str = "low"        # "high" | "medium" | "low"
    missing_fields: List[str] = []
    warnings: List[str] = []
