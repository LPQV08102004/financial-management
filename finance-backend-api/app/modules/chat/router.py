from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.shared.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.chat import service
from app.modules.chat.schemas import (
    ChatRequest, ChatResponse,
    ParseTransactionRequest, ParseTransactionResponse,
    ParseSavingsRequest, ParseSavingsResponse,
    ReceiptOCRRequest, OCRReceiptResponse,
)

router = APIRouter(prefix="/chat", tags=["Chat AI"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI financial assistant."""
    reply = await service.chat(db, current_user, body.message, body.history)
    return ChatResponse(reply=reply)


@router.post("/parse-transaction", response_model=ParseTransactionResponse)
async def parse_transaction(
    body: ParseTransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Extract structured transaction fields from a natural language message."""
    return await service.parse_transaction(db, current_user, body.message)


@router.post("/parse-savings", response_model=ParseSavingsResponse)
async def parse_savings(
    body: ParseSavingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Extract structured deposit/withdraw fields from a natural language message."""
    return await service.parse_savings_action(db, current_user, body.message)


@router.post("/parse-receipt", response_model=OCRReceiptResponse)
async def parse_receipt(
    body: ReceiptOCRRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Extract structured transaction data from a receipt image via OCR."""
    return await service.extract_receipt_ocr(body.image_base64, body.hint, current_user.id, db)
