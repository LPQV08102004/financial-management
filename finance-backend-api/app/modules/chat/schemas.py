from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str

class ParseTransactionRequest(BaseModel):
    message: str

class CategorySuggestion(BaseModel):
    id: int
    name: str
    confidence: int

class ParseTransactionResponse(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    note: Optional[str] = None
    category_suggestions: List[CategorySuggestion] = []
    missing_fields: List[str] = []
    warning: Optional[str] = None

class ParseSavingsRequest(BaseModel):
    message: str

class GoalSuggestion(BaseModel):
    id: int
    name: str
    confidence: int

class ParseSavingsResponse(BaseModel):
    action: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    note: Optional[str] = None
    goal_suggestions: List[GoalSuggestion] = []
    missing_fields: List[str] = []
    warning: Optional[str] = None

class ReceiptOCRRequest(BaseModel):
    image_base64: str
    hint: Optional[str] = None

class ReceiptItem(BaseModel):
    name: str
    qty: Optional[float] = None
    price: Optional[float] = None

class OCRReceiptResponse(BaseModel):
    amount: Optional[float] = None
    merchant_name: Optional[str] = None
    date: Optional[str] = None
    raw_text: str = ""
    type: str = "expense"
    note: Optional[str] = None
    items: List[ReceiptItem] = []
    category_suggestions: List[CategorySuggestion] = []
    confidence_level: str = "low"
    missing_fields: List[str] = []
    warnings: List[str] = []
