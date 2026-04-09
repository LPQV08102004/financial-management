from datetime import datetime
from decimal import Decimal
from typing import List
import json

import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.exceptions import BadRequestError
from app.modules.auth.models import User
from app.modules.transactions.models import Transaction
from app.modules.categories.models import Category
from app.modules.accounts.models import Account
from app.shared.enums import TransactionType
from app.modules.chat.schemas import (
    ChatMessage, ParseTransactionResponse, CategorySuggestion,
    ParseSavingsResponse, GoalSuggestion,
)
from app.modules.savings_goals.models import SavingsGoal

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_financial_context(db: Session, user_id: int) -> str:
    """Build a financial summary string to inject as system context."""
    today = datetime.today()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total balance across all accounts
    accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()
    total_balance = sum(a.current_balance for a in accounts) if accounts else Decimal("0")

    # This month income/expense
    month_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.income,
        Transaction.transaction_date >= month_start,
    ).scalar() or Decimal("0")

    month_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense,
        Transaction.transaction_date >= month_start,
    ).scalar() or Decimal("0")

    # Last 10 transactions with category names
    recent_txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc())
        .limit(10)
        .all()
    )

    # Batch-load category names
    cat_ids = {t.category_id for t in recent_txns if t.category_id}
    cat_map = {}
    if cat_ids:
        cats = db.query(Category).filter(Category.id.in_(cat_ids)).all()
        cat_map = {c.id: c.name for c in cats}

    txn_lines = []
    for t in recent_txns:
        cat_name = cat_map.get(t.category_id, "N/A")
        txn_lines.append(
            f"  - {t.transaction_date.strftime('%d/%m/%Y')} | {t.type.value} | "
            f"{t.amount:,.0f} VND | {cat_name} | {t.note or ''}"
        )
    txn_block = "\n".join(txn_lines) if txn_lines else "  (no transactions yet)"

    # Accounts list
    acc_lines = [f"  - {a.name}: {a.current_balance:,.0f} VND" for a in accounts] or ["  (no accounts)"]
    acc_block = "\n".join(acc_lines)

    return f"""Thông tin tài chính của người dùng (cập nhật {today.strftime('%d/%m/%Y')}):
- Tổng số dư: {total_balance:,.0f} VND
- Tháng này:
  + Thu nhập: {month_income:,.0f} VND
  + Chi tiêu: {month_expense:,.0f} VND
  + Tiết kiệm ròng: {(month_income - month_expense):,.0f} VND
- Tài khoản:
{acc_block}
- 10 giao dịch gần nhất:
{txn_block}"""


async def chat(db: Session, user: User, message: str, history: List[ChatMessage]) -> str:
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình trong server.")

    financial_context = _get_financial_context(db, user.id)

    system_prompt = f"""Bạn là trợ lý tài chính cá nhân. Bạn CHỈ trả lời các câu hỏi liên quan đến tài chính cá nhân, chi tiêu, thu nhập, tiết kiệm, ngân sách và dữ liệu tài chính của người dùng.

Nếu câu hỏi KHÔNG liên quan đến tài chính (ví dụ: tin tức, thể thao, công nghệ, xã hội, giải trí...), hãy từ chối ngắn gọn bằng một câu duy nhất như: "Tôi chỉ hỗ trợ các câu hỏi về tài chính cá nhân." — KHÔNG hỏi lại, KHÔNG giải thích thêm.

Chỉ trả lời dựa trên thông tin thực tế được cung cấp bên dưới. Nếu không đủ dữ liệu, nói rõ điều đó.

{financial_context}"""

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:  # keep last 10 turns to avoid token overflow
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.7,
            },
        )

    if resp.status_code != 200:
        raise BadRequestError(f"Groq API lỗi: {resp.status_code} - {resp.text}")

    data = resp.json()
    return data["choices"][0]["message"]["content"]


# ── NLP Transaction Parsing ────────────────────────────────────────────────────

async def parse_transaction(db: Session, user: User, message: str) -> ParseTransactionResponse:
    """Extract structured transaction fields from a natural language message."""
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình.")

    today = datetime.today()

    # Fetch user's categories to help with suggestion
    categories = db.query(Category).filter(
        Category.user_id == user.id,
        Category.is_active == True,
    ).all()
    cat_list = [{"id": c.id, "name": c.name, "type": c.type.value} for c in categories]

    system_prompt = f"""Bạn là engine trích xuất dữ liệu tài chính. Hôm nay là {today.strftime('%Y-%m-%d')}.

Từ câu đầu vào, hãy trích xuất JSON với các trường sau (không giải thích thêm, chỉ trả về JSON thuần):
{{
  "type": "expense" | "income" | null,
  "amount": <số nguyên VND> | null,
  "date": "<YYYY-MM-DD>" | null,
  "note": "<mô tả ngắn>" | null,
  "category_suggestions": [
    {{"id": <id từ danh sách>, "name": "<tên>", "confidence": <0-100>}}
  ]
}}

Quy tắc số tiền tiếng Việt:
- "220k" / "220 nghìn" / "220 ngàn" = 220000
- "1 triệu rưỡi" / "1.5 triệu" = 1500000
- "2 trăm rưỡi" = 250000
- "1 triệu 2" = 1200000

Quy tắc ngày:
- "hôm nay" = {today.strftime('%Y-%m-%d')}
- "hôm qua" / "tối qua" / "sáng qua" = {(today.replace(day=today.day-1)).strftime('%Y-%m-%d') if today.day > 1 else today.strftime('%Y-%m-%d')}

Danh sách danh mục của người dùng (chỉ gợi ý từ danh sách này):
{json.dumps(cat_list, ensure_ascii=False)}

Trả về tối đa 3 category_suggestions, sắp xếp theo confidence giảm dần.
Nếu không tìm được danh mục phù hợp, để category_suggestions = [].
Chỉ trả về JSON, không có markdown, không có giải thích."""

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "max_tokens": 512,
                "temperature": 0.1,   # low temp for structured extraction
            },
        )

    if resp.status_code != 200:
        raise BadRequestError(f"Groq API lỗi: {resp.status_code}")

    raw = resp.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise BadRequestError("Không thể phân tích câu nhập — vui lòng thử lại.")

    # Determine missing required fields
    missing = []
    if not parsed.get("amount"):
        missing.append("amount")
    if not parsed.get("type"):
        missing.append("type")
    if not parsed.get("date"):
        missing.append("date")
    if parsed.get("type") == "expense" and not parsed.get("category_suggestions"):
        missing.append("category")

    suggestions = [
        CategorySuggestion(
            id=s["id"],
            name=s["name"],
            confidence=s.get("confidence", 0)
        )
        for s in parsed.get("category_suggestions", [])
        if s.get("id") and s.get("name")
    ]

    return ParseTransactionResponse(
        type=parsed.get("type"),
        amount=parsed.get("amount"),
        date=parsed.get("date"),
        note=parsed.get("note"),
        category_suggestions=suggestions,
        missing_fields=missing,
    )


# ── NLP Savings Action Parsing ─────────────────────────────────────────────────

async def parse_savings_action(db: Session, user: User, message: str) -> ParseSavingsResponse:
    """Extract structured deposit/withdraw fields from a natural language message."""
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình.")

    today = datetime.today()

    # Fetch user's active savings goals
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_active == True,
    ).all()
    goal_list = [
        {"id": g.id, "name": g.name, "saved": float(g.saved_amount), "target": float(g.target_amount)}
        for g in goals
    ]

    system_prompt = f"""Bạn là engine trích xuất dữ liệu tài chính. Hôm nay là {today.strftime('%Y-%m-%d')}.

Từ câu đầu vào, hãy trích xuất JSON với các trường sau (không giải thích thêm, chỉ trả về JSON thuần):
{{
  "action": "deposit" | "withdraw" | null,
  "amount": <số nguyên VND> | null,
  "date": "<YYYY-MM-DD>" | null,
  "note": "<mô tả ngắn>" | null,
  "goal_suggestions": [
    {{"id": <id từ danh sách>, "name": "<tên>", "confidence": <0-100>}}
  ]
}}

Quy tắc hành động:
- "nạp", "gửi", "bỏ vào", "để vào", "tiết kiệm thêm" = "deposit"
- "rút", "lấy ra", "rút ra", "lấy từ" = "withdraw"

Quy tắc số tiền tiếng Việt:
- "220k" / "220 nghìn" / "220 ngàn" = 220000
- "1 triệu rưỡi" / "1.5 triệu" = 1500000
- "2 trăm rưỡi" = 250000
- "1 triệu 2" = 1200000

Quy tắc ngày:
- "hôm nay" = {today.strftime('%Y-%m-%d')}
- "hôm qua" = {(today.replace(day=today.day-1)).strftime('%Y-%m-%d') if today.day > 1 else today.strftime('%Y-%m-%d')}

Danh sách mục tiêu tiết kiệm của người dùng (chỉ gợi ý từ danh sách này):
{json.dumps(goal_list, ensure_ascii=False)}

Trả về tối đa 3 goal_suggestions, sắp xếp theo confidence giảm dần.
Nếu không tìm được mục tiêu phù hợp, để goal_suggestions = [].
Chỉ trả về JSON, không có markdown, không có giải thích."""

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "max_tokens": 512,
                "temperature": 0.1,
            },
        )

    if resp.status_code != 200:
        raise BadRequestError(f"Groq API lỗi: {resp.status_code}")

    raw = resp.json()["choices"][0]["message"]["content"].strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise BadRequestError("Không thể phân tích câu nhập — vui lòng thử lại.")

    missing = []
    if not parsed.get("amount"):
        missing.append("amount")
    if not parsed.get("action"):
        missing.append("action")
    if not parsed.get("date"):
        missing.append("date")
    if not parsed.get("goal_suggestions"):
        missing.append("goal")

    suggestions = [
        GoalSuggestion(id=s["id"], name=s["name"], confidence=s.get("confidence", 0))
        for s in parsed.get("goal_suggestions", [])
        if s.get("id") and s.get("name")
    ]

    return ParseSavingsResponse(
        action=parsed.get("action"),
        amount=parsed.get("amount"),
        date=parsed.get("date"),
        note=parsed.get("note"),
        goal_suggestions=suggestions,
        missing_fields=missing,
    )
