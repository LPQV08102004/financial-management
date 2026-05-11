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
    OCRReceiptResponse, ReceiptItem,
)
from app.modules.savings_goals.models import SavingsGoal

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def _get_financial_context(db: Session, user_id: int) -> str:
    today = datetime.today()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()
    total_balance = sum(a.current_balance for a in accounts) if accounts else Decimal("0")

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

    recent_txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc())
        .limit(10)
        .all()
    )

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

    acc_lines = [f"  - {a.name}: {a.current_balance:,.0f} VND" for a in accounts] or ["  (no accounts)"]
    acc_block = "\n".join(acc_lines)

    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id, SavingsGoal.is_active == True)
        .all()
    )
    goal_lines = []
    for g in goals:
        saved = Decimal(str(g.saved_amount))
        target = Decimal(str(g.target_amount))
        remaining = target - saved
        progress = (saved / target * 100) if target > 0 else Decimal("0")
        deadline = g.target_date.strftime('%d/%m/%Y') if getattr(g, 'target_date', None) else "không hạn"
        goal_lines.append(
            f"  - {g.name}: đã tiết kiệm {saved:,.0f}/{target:,.0f} VND "
            f"({progress:.0f}%), còn thiếu {remaining:,.0f} VND, hạn {deadline}"
        )
    goal_block = "\n".join(goal_lines) if goal_lines else "  (chưa có mục tiêu tiết kiệm)"

    return f"""Thông tin tài chính của người dùng (cập nhật {today.strftime('%d/%m/%Y')}):
- Tổng số dư: {total_balance:,.0f} VND
- Tháng này:
  + Thu nhập: {month_income:,.0f} VND
  + Chi tiêu: {month_expense:,.0f} VND
  + Tiết kiệm ròng: {(month_income - month_expense):,.0f} VND
- Tài khoản:
{acc_block}
- Mục tiêu tiết kiệm:
{goal_block}
- 10 giao dịch gần nhất:
{txn_block}"""

async def chat(db: Session, user: User, message: str, history: List[ChatMessage]) -> str:
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình trong server.")

    financial_context = _get_financial_context(db, user.id)

    system_prompt = f"""Bạn là trợ lý tài chính cá nhân. Bạn CHỈ trả lời các câu hỏi liên quan đến tài chính cá nhân, chi tiêu, thu nhập, tiết kiệm, mục tiêu tiết kiệm, ngân sách, đầu tư cá nhân, lập kế hoạch tài chính, và dữ liệu tài chính của người dùng.

Khi người dùng hỏi về việc tiết kiệm cho một mục tiêu cụ thể (mua laptop, du lịch, mua xe, mua nhà, học phí…), hãy tra cứu trong phần "Mục tiêu tiết kiệm" bên dưới và đưa ra lời khuyên dựa trên: số đã tiết kiệm, số còn thiếu, hạn chót, và khả năng tiết kiệm hàng tháng (thu nhập - chi tiêu).

Nếu câu hỏi KHÔNG liên quan đến tài chính (ví dụ: tin tức, thể thao, công nghệ, xã hội, giải trí, thời tiết, nấu ăn...), hãy từ chối ngắn gọn bằng một câu duy nhất như: "Tôi chỉ hỗ trợ các câu hỏi về tài chính cá nhân." — KHÔNG hỏi lại, KHÔNG giải thích thêm.

Chỉ trả lời dựa trên thông tin thực tế được cung cấp bên dưới. Nếu không đủ dữ liệu, nói rõ điều đó.

Khi liệt kê danh sách giao dịch hoặc danh sách mục tiêu, hãy trình bày MỖI mục trên MỘT DÒNG RIÊNG (dùng ký tự xuống dòng \\n giữa các mục), không gộp thành một đoạn liền.

{financial_context}"""

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
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

async def parse_transaction(db: Session, user: User, message: str) -> ParseTransactionResponse:
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình.")

    today = datetime.today()

    categories = db.query(Category).filter(
        Category.user_id == user.id,
        Category.is_active == True,
    ).all()
    cat_list = [{"id": c.id, "name": c.name, "type": c.type.value} for c in categories]

    accounts = db.query(Account).filter(
        Account.user_id == user.id,
        Account.is_active == True,
    ).all()
    total_balance = float(sum(Decimal(str(a.current_balance)) for a in accounts)) if accounts else 0.0
    acc_lines_txn = [f"  - {a.name}: {float(a.current_balance):,.0f} VND" for a in accounts]

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

Tổng số dư tài khoản của người dùng: {total_balance:,.0f} VND
Các tài khoản:
{chr(10).join(acc_lines_txn) if acc_lines_txn else '  (không có tài khoản)'}

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

    txn_warning: str | None = None
    parsed_amount = parsed.get("amount")
    if parsed_amount and parsed.get("type") == "expense" and parsed_amount > total_balance:
        txn_warning = (
            f"⚠️ Số tiền chi tiêu ({parsed_amount:,.0f} đ) vượt quá tổng số dư tài khoản "
            f"({total_balance:,.0f} đ). Hãy kiểm tra lại số dư trước khi xác nhận."
        )

    return ParseTransactionResponse(
        type=parsed.get("type"),
        amount=parsed_amount,
        date=parsed.get("date"),
        note=parsed.get("note"),
        category_suggestions=suggestions,
        missing_fields=missing,
        warning=txn_warning,
    )

async def parse_savings_action(db: Session, user: User, message: str) -> ParseSavingsResponse:
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình.")

    today = datetime.today()

    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user.id,
        SavingsGoal.is_active == True,
    ).all()

    accounts = db.query(Account).filter(
        Account.user_id == user.id,
        Account.is_active == True,
    ).all()
    total_balance = float(sum(Decimal(str(a.current_balance)) for a in accounts)) if accounts else 0.0
    acc_lines = [f"  - {a.name}: {float(a.current_balance):,.0f} VND" for a in accounts]

    goal_list = [
        {
            "id": g.id,
            "name": g.name,
            "saved": float(g.saved_amount),
            "target": float(g.target_amount),
            "remaining": float(Decimal(str(g.target_amount)) - Decimal(str(g.saved_amount))),
        }
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

Tổng số dư tài khoản của người dùng: {total_balance:,.0f} VND
Các tài khoản:
{chr(10).join(acc_lines) if acc_lines else '  (không có tài khoản)'}

Danh sách mục tiêu tiết kiệm của người dùng (chỉ gợi ý từ danh sách này, mỗi mục có "remaining" = số tiền còn cần nạp):
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

    warning: str | None = None
    parsed_amount = parsed.get("amount")
    parsed_action = parsed.get("action")

    if parsed_amount and parsed_action == "deposit" and suggestions:

        matched_goal = next((g for g in goals if g.id == suggestions[0].id), None)
        if matched_goal:
            remaining = float(Decimal(str(matched_goal.target_amount)) - Decimal(str(matched_goal.saved_amount)))
            cap = min(remaining, total_balance)
            if parsed_amount > cap:
                warning = (
                    f"⚠️ Số tiền bạn muốn nạp ({parsed_amount:,.0f} đ) vượt quá giới hạn. "
                    f"Còn thiếu {remaining:,.0f} đ cho mục tiêu '{matched_goal.name}', "
                    f"số dư tài khoản là {total_balance:,.0f} đ. "
                    f"Đã điều chỉnh xuống {cap:,.0f} đ."
                )
                parsed_amount = cap

    if parsed_amount and parsed_action == "withdraw" and suggestions:
        matched_goal = next((g for g in goals if g.id == suggestions[0].id), None)
        if matched_goal:
            saved = float(matched_goal.saved_amount)
            if parsed_amount > saved:
                warning = (
                    f"⚠️ Số tiền muốn rút ({parsed_amount:,.0f} đ) vượt quá số đã tích lũy "
                    f"({saved:,.0f} đ) trong mục tiêu '{matched_goal.name}'. "
                    f"Đã điều chỉnh xuống {saved:,.0f} đ."
                )
                parsed_amount = saved

    if not warning and parsed_action == "deposit" and parsed_amount and parsed_amount > total_balance:
        warning = (
            f"⚠️ Số dư tài khoản ({total_balance:,.0f} đ) không đủ để nạp {parsed_amount:,.0f} đ."
        )
        parsed_amount = total_balance

    return ParseSavingsResponse(
        action=parsed_action,
        amount=parsed_amount,
        date=parsed.get("date"),
        note=parsed.get("note"),
        goal_suggestions=suggestions,
        missing_fields=missing,
        warning=warning,
    )

async def _call_groq_vision(image_base64: str, hint: str | None) -> dict:
    if not settings.GROQ_API_KEY:
        raise BadRequestError("GROQ_API_KEY chưa được cấu hình.")

    hint_text = f"\nGợi ý loại cửa hàng: {hint}" if hint else ""
    prompt = f"""Phân tích hóa đơn/biên lai trong ảnh và trả về JSON với các trường sau (không giải thích, chỉ JSON thuần):
{{
  "merchant": "<tên cửa hàng hoặc null>",
  "date": "<ngày định dạng DD/MM/YYYY hoặc YYYY-MM-DD hoặc null>",
  "total_amount": "<số tiền cuối cùng phải trả, chỉ gồm chữ số, hoặc null>",
  "items": [
    {{"name": "<tên sản phẩm>", "qty": <số lượng hoặc null>, "price": <giá từng dòng hoặc đơn giá chỉ gồm chữ số, hoặc null>}}
  ],
  "currency": "VND",
  "raw_text": "<toàn bộ văn bản trích xuất được từ ảnh>"
}}{hint_text}

Nếu không đọc được một trường, đặt null. Chỉ trả về JSON, không có markdown."""

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                "max_tokens": 1024,
                "temperature": 0.1,
            },
        )

    if resp.status_code != 200:
        raise BadRequestError(f"Groq Vision API lỗi: {resp.status_code} - {resp.text[:200]}")

    raw = resp.json()["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"merchant": None, "date": None, "total_amount": None, "items": [], "raw_text": raw}

def _parse_ocr_amount(raw_amount: str | None) -> float | None:
    if not raw_amount:
        return None

    cleaned = str(raw_amount).replace(",", "").replace(".", "").replace(" ", "")
    cleaned = ''.join(c for c in cleaned if c.isdigit())
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None

def _parse_ocr_date(raw_date: str | None) -> str | None:
    if not raw_date:
        return None
    raw_date = raw_date.strip()

    if len(raw_date) == 10 and raw_date[4] == '-':
        return raw_date

    parts = raw_date.replace('-', '/').split('/')
    if len(parts) == 3:
        try:
            if len(parts[2]) == 4:

                d, m, y = parts
            else:

                y, m, d = parts
            return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
        except (ValueError, IndexError):
            return None
    return None

def _assess_ocr_quality(amount: float | None, date: str | None, merchant: str | None) -> tuple[str, list[str]]:
    extracted = sum(1 for v in [amount, date, merchant] if v is not None)
    warnings = []
    if amount is None:
        warnings.append("Không xác định được số tiền — vui lòng nhập thủ công")
    if date is None:
        warnings.append("Không xác định được ngày — vui lòng nhập thủ công")
    if merchant is None:
        warnings.append("Không xác định được tên cửa hàng")

    if extracted == 3:
        level = "high"
    elif extracted >= 1:
        level = "medium"
    else:
        level = "low"
    return level, warnings

async def _suggest_categories_for_receipt(
    user_id: int,
    context: str,
    db: Session,
) -> list[CategorySuggestion]:
    if not settings.GROQ_API_KEY:
        return []

    categories = db.query(Category).filter(
        Category.user_id == user_id,
        Category.is_active == True,
    ).all()
    if not categories:
        return []

    cat_list = [{"id": c.id, "name": c.name} for c in categories]

    prompt = f"""Dựa trên hóa đơn sau: {context}

Đây là danh mục chi tiêu của người dùng:
{json.dumps(cat_list, ensure_ascii=False)}

Gợi ý top 3 danh mục chi tiêu phù hợp nhất. Trả về JSON (không có markdown):
[
  {{"id": <id>, "confidence": <0-100>}},
  ...
]
Chỉ dùng id từ danh sách trên. Nếu không phù hợp, trả về []."""

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 256,
                "temperature": 0.1,
            },
        )

    if resp.status_code != 200:
        return []

    raw = resp.json()["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        suggestions_raw = json.loads(raw)
        if not isinstance(suggestions_raw, list):
            return []
    except json.JSONDecodeError:
        return []

    cat_map = {c.id: c.name for c in categories}
    result = []
    for s in suggestions_raw:
        cat_id = s.get("id")
        if cat_id and cat_id in cat_map:
            result.append(CategorySuggestion(
                id=cat_id,
                name=cat_map[cat_id],
                confidence=max(0, min(100, int(s.get("confidence", 0)))),
            ))
    return result[:3]

async def extract_receipt_ocr(
    image_base64: str,
    hint: str | None,
    user_id: int,
    db: Session,
) -> OCRReceiptResponse:

    vision_data = await _call_groq_vision(image_base64, hint)

    raw_text = vision_data.get("raw_text") or ""
    merchant = vision_data.get("merchant") or None
    amount = _parse_ocr_amount(vision_data.get("total_amount"))
    date = _parse_ocr_date(vision_data.get("date"))
    raw_items = vision_data.get("items") or []

    parsed_items: list[ReceiptItem] = []
    for it in raw_items:
        if isinstance(it, dict):
            name = it.get("name") or ""
            if not name:
                continue
            qty_raw = it.get("qty")
            price_raw = it.get("price")
            try:
                qty = float(qty_raw) if qty_raw is not None else None
            except (ValueError, TypeError):
                qty = None
            try:
                price = float(str(price_raw).replace(",", "").replace(".", "")) if price_raw is not None else None
            except (ValueError, TypeError):
                price = None
            parsed_items.append(ReceiptItem(name=name, qty=qty, price=price))
        elif isinstance(it, str) and it.strip():
            parsed_items.append(ReceiptItem(name=it.strip()))

    context_parts = []
    if merchant:
        context_parts.append(merchant)
    if parsed_items:
        context_parts.append(", ".join(i.name for i in parsed_items[:5]))
    if amount:
        context_parts.append(f"{amount:,.0f} VND")
    context = " - ".join(context_parts) if context_parts else "hóa đơn mua hàng"

    suggestions = await _suggest_categories_for_receipt(user_id, context, db)

    confidence_level, warnings = _assess_ocr_quality(amount, date, merchant)

    missing = []
    if amount is None:
        missing.append("amount")
    if date is None:
        missing.append("date")
    if not suggestions:
        missing.append("category")

    return OCRReceiptResponse(
        amount=amount,
        merchant_name=merchant,
        date=date or datetime.today().strftime("%Y-%m-%d"),
        raw_text=raw_text,
        type="expense",
        note=merchant,
        items=parsed_items,
        category_suggestions=suggestions,
        confidence_level=confidence_level,
        missing_fields=missing,
        warnings=warnings,
    )
