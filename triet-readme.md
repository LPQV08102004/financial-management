# Triết – Hướng dẫn thực hiện Analytics & Dashboard

## Vai trò của bạn

Bạn phụ trách **Chức năng số 3 (Thống kê trực quan)** và **Chức năng số 4 (Tính toán số dư)**.

Cụ thể gồm 2 phần:

| Phần | Mô tả |
|---|---|
| **Backend API** | Viết các endpoint trong `finance-backend-api` để tính tổng thu/chi, số dư, thống kê theo kỳ |
| **Frontend (Mobile)** | Kết nối 2 màn hình `HomeScreen.js` và `Chart.js` với API thực – thay thế dữ liệu cứng (hardcode) hiện tại |

---

## Tổng quan kiến trúc

```
finance-backend-api/
└── app/
    └── modules/
        └── analytics/          ← Bạn tạo mới folder này
            ├── __init__.py
            ├── router.py       ← Định nghĩa các API endpoint
            ├── service.py      ← Logic tính toán (dùng pandas / sqlalchemy)
            └── schemas.py      ← Định nghĩa JSON trả về
```

> **Lưu ý:** Folder `analytics` chưa tồn tại trong `modules/` (hiện tại chỉ có `budgets/`, `categories/`, `transactions/`). Bạn cần tạo mới.

Bên cạnh đó, trong `main.py` đã có sẵn dòng import:
```python
from app.modules.analytics.router import reports_router, dashboard_router
```
→ Bạn phải đặt đúng tên biến router là `reports_router` và `dashboard_router`.

---

## Phần 1 – Backend API

### Chức năng số 4: Tính toán số dư

#### API đã xây dựng

**Lấy số dư theo kỳ**

```
GET /api/v1/analytics/dashboard/balance
```

| Query param | Bắt buộc | Mô tả |
|---|---|---|
| `period` | không (mặc định: `month`) | `day` / `week` / `month` / `year` / `custom` |
| `date` | không | Ngày tham chiếu `YYYY-MM-DD` (mặc định: hôm nay) |
| `from_date` | khi `period=custom` | `YYYY-MM-DD` |
| `to_date` | khi `period=custom` | `YYYY-MM-DD` |

Trả về:
```json
{
  "total_income": 5000000,
  "total_expense": 2000000,
  "balance": 3000000,
  "period": "month",
  "from_date": "2026-03-01",
  "to_date": "2026-03-31"
}
```

#### Logic tính toán (viết trong `service.py`)

- Lấy tất cả `Transaction` của `user_id` hiện tại.
- `TransactionType.income` → cộng vào `total_income`.
- `TransactionType.expense` → cộng vào `total_expense`.
- `balance = total_income - total_expense`.
- Dùng SQLAlchemy `func.sum()` để tổng hợp trực tiếp trên DB (hiệu năng tốt hơn pandas cho bài toán tổng đơn giản).

---

### Chức năng số 3: Thống kê trực quan

#### API đã xây dựng

**1. Thống kê theo danh mục (biểu đồ tròn ở HomeScreen)**

```
GET /api/v1/analytics/reports/by-category
```

| Query param | Bắt buộc | Mô tả |
|---|---|---|
| `type` | không (mặc định: `expense`) | `income` / `expense` / `all` |
| `period` | không (mặc định: `month`) | `day` / `week` / `month` / `year` / `custom` |
| `date` | không | Ngày tham chiếu `YYYY-MM-DD` |
| `from_date` | khi `period=custom` | `YYYY-MM-DD` |
| `to_date` | khi `period=custom` | `YYYY-MM-DD` |

Trả về:
```json
[
  { "category_id": 1, "category": "Ăn uống", "amount": 500000, "color": "#4CAF50", "percentage": 62.5 },
  { "category_id": 2, "category": "Di chuyển", "amount": 200000, "color": "#F44336", "percentage": 25.0 }
]
```

**2. Thống kê theo thời gian (biểu đồ cột ở Chart.js)**

```
GET /api/v1/analytics/reports/over-time
```

| Query param | Bắt buộc | Mô tả |
|---|---|---|
| `type` | không (mặc định: `all`) | `income` / `expense` / `all` |
| `period` | không (mặc định: `week`) | `day` / `week` / `month` / `year` / `custom` |
| `date` | không | Ngày tham chiếu `YYYY-MM-DD` |
| `from_date` | khi `period=custom` | `YYYY-MM-DD` |
| `to_date` | khi `period=custom` | `YYYY-MM-DD` |

Trả về (nhóm theo ngày, trừ `year` → nhóm theo tháng T1..T12):
```json
[
  { "label": "30/3", "income": 300000, "expense": 150000 },
  { "label": "31/3", "income": 0, "expense": 80000 }
]
```

#### Cách lọc dữ liệu (đã viết trong `service.py`)

Dùng SQLAlchemy `func.sum()` + `func.date_format()` trực tiếp trên DB. Không cần xử lý thêm với pandas.

---

### Các model và enum đã có sẵn

Bạn **không cần tạo model mới**, chỉ cần đọc từ bảng `transactions` và `categories`:

| File | Thứ bạn cần dùng |
|---|---|
| `app/modules/transactions/models.py` | `Transaction` (có `type`, `amount`, `transaction_date`, `category_id`) |
| `app/modules/categories/models.py` | `Category` (có `name`) |
| `app/shared/enums.py` | `TransactionType` (income / expense / transfer) |
| `app/shared/dependencies.py` | `get_current_user` – lấy user đang đăng nhập |
| `app/db/session.py` | `get_db` – lấy DB session |

---

### Cấu trúc `router.py` (đã hoàn thành)

```python
dashboard_router = APIRouter(prefix="/analytics/dashboard", tags=["Dashboard"])
reports_router   = APIRouter(prefix="/analytics/reports",   tags=["Analytics Reports"])
```

Các endpoint đã tạo:
- `GET /api/v1/analytics/dashboard/balance`
- `GET /api/v1/analytics/reports/by-category`
- `GET /api/v1/analytics/reports/over-time`

---

## Phần 2 – Frontend (Mobile)

### Hiện trạng

Cả `HomeScreen.js` và `Chart.js` hiện đang dùng **dữ liệu cứng** (hardcode):

```js
// Chart.js - dòng 36
const allTransactions = [
  { id: '1', name: 'Sức khỏe', amount: 50000, ... },
  ...
];
```

→ Bạn cần thay thế bằng lời gọi API thực.

### Bước 1: Tạo file `src/api/analyticsApi.js`

```js
const BASE_URL = 'http://<IP_MÁY_CHỦ>:8000/api/v1';

export async function getBalance(token) {
  const res = await fetch(`${BASE_URL}/analytics/dashboard/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getStatsByCategory(token, type = 'expense', period = 'month', year, month) {
  const params = new URLSearchParams({ type, period, year, month });
  const res = await fetch(`${BASE_URL}/analytics/reports/by-category?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getOverTime(token, type = 'all', period = 'week', date) {
  const params = new URLSearchParams({ type, period, date });
  const res = await fetch(`${BASE_URL}/analytics/reports/over-time?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

### Bước 2: Kết nối `HomeScreen.js`

- Dùng `useEffect` để gọi `getBalance()` và `getStatsByCategory()` khi màn hình load hoặc khi `timePeriod` / `selectedDate` thay đổi.
- Thay thế `5,000,000 đ` hardcode bằng giá trị từ API (`balance`).
- Dữ liệu biểu đồ tròn lấy từ `getStatsByCategory()` thay vì code cứng phần `strokeDasharray`.

### Bước 3: Kết nối `Chart.js`

- Thay mảng `allTransactions` bằng kết quả từ `getOverTime()`.
- Gọi lại API khi `activeTab` hoặc `timePeriod` thay đổi.

### Bước 4: Quản lý token xác thực

Token JWT được cấp sau khi đăng nhập (do Toản xây dựng). Bạn cần:
- Nhận token từ màn hình đăng nhập qua `navigation.params` hoặc context chung.
- Lưu token vào `AsyncStorage` để dùng lại.

```bash
npx expo install @react-native-async-storage/async-storage
```

---

## Thứ tự thực hiện gợi ý

```
Backend ✅ XONG → Test API → Frontend
```

**Backend (đã hoàn thành):**
- [x] `app/modules/analytics/__init__.py`
- [x] `app/modules/analytics/schemas.py`
- [x] `app/modules/analytics/service.py`
- [x] `app/modules/analytics/router.py`

**Tiếp theo:**
1. **Chạy backend** và test tại `http://localhost:8000/docs` (phối hợp với Toản để có `.env` + DB)
2. **Tạo `src/api/analyticsApi.js`** trong mobile-app
3. **Cập nhật `HomeScreen.js`** – kết nối balance + pie chart
4. **Cập nhật `Chart.js`** – kết nối bar chart

---

## Lưu ý quan trọng

- **Đừng đụng vào** `main.py` – file đó do Toản quản lý và đã import sẵn router của bạn.
- **Đừng sửa** các model của `transactions/` hay `categories/` – chỉ đọc từ chúng.
- Mọi API đều cần user đăng nhập (dùng `Depends(get_current_user)`), đừng bỏ qua bước này.
- Khi chạy backend local, thêm `.env` file với ít nhất `DATABASE_URL` và `SECRET_KEY` (phối hợp với Toản).
- Khi chạy mobile với Expo, đổi `localhost` thành IP máy tính thực (ví dụ: `192.168.1.x`) vì điện thoại/giả lập Android không nhận `localhost`.


---

## Phần 3 – Chatbot AI & Module NLP (Trợ lý tài chính)

Hệ thống có một module **Chat AI** hoàn chỉnh đóng vai trò trợ lý tài chính cá nhân, đồng thời là **engine NLP** để chuyển câu nói tự nhiên của người dùng thành **JSON có cấu trúc** — từ đó tự động tạo giao dịch thu/chi, nạp/rút tiết kiệm hoặc bóc tách hoá đơn từ ảnh.

> **Trả lời ngắn cho câu hỏi "Có NLP không?":**
> **CÓ.** Dự án có hẳn một pipeline NLP – Information Extraction với **3 endpoint riêng** (`parse-transaction`, `parse-savings`, `parse-receipt`) chuyển text/ảnh → JSON, kèm `TransactionConfirmCard` / `SavingsConfirmCard` / `ReceiptConfirmCard` để người dùng xác nhận trước khi ghi vào DB.

### 3.1. Large Language Model (LLM) & Groq API

| Thành phần | Giá trị sử dụng trong dự án |
|---|---|
| **Provider** | [Groq](https://groq.com) – inference engine chạy trên chip **LPU (Language Processing Unit)** |
| **Text model** | `llama-3.3-70b-versatile` (Meta LLaMA 3.3 70B) |
| **Vision model** | `meta-llama/llama-4-scout-17b-16e-instruct` (LLaMA 4 Scout, multimodal – dùng cho OCR ảnh hoá đơn) |
| **Endpoint** | `https://api.groq.com/openai/v1/chat/completions` (tương thích OpenAI Chat Completions) |
| **API key** | Đặt trong biến môi trường `GROQ_API_KEY` của backend |
| **Tham số chat** | `max_tokens=1024`, `temperature=0.7` (trả lời tự do) |
| **Tham số NLP/OCR** | `max_tokens=512`, `temperature=0.1` (trích xuất xác định, ít ngẫu nhiên) |

**Vì sao chọn Groq?** Groq dùng chip LPU cho tốc độ sinh văn bản vượt trội so với GPU truyền thống, free tier hỗ trợ LLaMA 3 (8B/70B) và LLaMA 4 — phù hợp cho prototype yêu cầu **latency thấp** khi người dùng nhập câu rồi chờ JSON trả về để render confirm card.

So sánh với các provider khác:
- **OpenAI (GPT-4)**: chất lượng cao hơn nhưng chậm và đắt.
- **Gemini**: free tier rộng nhưng latency không ổn định ở khu vực VN.
- **Groq + LLaMA 3.3/4**: cân bằng tốt giữa tốc độ – chi phí – chất lượng cho use case chatbot tài chính.

Tất cả lời gọi LLM nằm trong `finance-backend-api/app/modules/chat/service.py`, được expose qua các route ở [router.py](finance-backend-api/app/modules/chat/router.py).

### 3.2. Pipeline NLP – Information Extraction (text → JSON)

Module sử dụng cách tiếp cận **(3) LLM Prompt Engineering** (không phải rule-based, không phải ML sequence labeling/NER truyền thống). Lý do chọn:

| Cách tiếp cận | Ưu | Nhược | Dự án có dùng? |
|---|---|---|---|
| (1) Rule-based (regex) | Nhanh, không cần model | Khó mở rộng cho tiếng Việt tự nhiên ("220k", "1 triệu rưỡi", "tối qua"…) | ❌ |
| (2) ML sequence labeling (NER) | Chính xác sau khi train | Cần dataset nhãn lớn, không có sẵn cho domain tài chính tiếng Việt | ❌ |
| (3) **LLM prompt engineering** | Hiểu tiếng Việt tự nhiên, không cần training, dễ điều chỉnh schema | Phụ thuộc API ngoài, cần xử lý JSON parse lỗi | ✅ |

Pipeline chung của 3 endpoint trích xuất:

```
User text  ──►  System prompt (schema + few-shot rules + dữ liệu user)
                          │
                          ▼
            Groq LLaMA 3.3 70B (temperature=0.1)
                          │
                          ▼
         Strip markdown fences  →  json.loads()
                          │
                          ▼
   Pydantic Response (ParseTransactionResponse / ParseSavingsResponse / OCRReceiptResponse)
                          │
                          ▼
   ConfirmCard ở mobile / web   →   User sửa & confirm   →   POST tạo giao dịch thật
```

Mọi prompt đều **inject ngữ cảnh thật của user** (danh mục, số dư, mục tiêu tiết kiệm) để LLM gợi ý `id` chính xác chứ không bịa, và yêu cầu trả về **JSON thuần (không markdown, không giải thích)**.

### 3.3. Ba endpoint NLP chính

#### A. `POST /api/v1/chat/parse-transaction` – Trích xuất giao dịch thu/chi

Người dùng gõ: *"hôm qua tôi ăn trưa hết 220k"* → Backend trả JSON:

```json
{
  "type": "expense",
  "amount": 220000,
  "date": "2026-05-07",
  "note": "ăn trưa",
  "category_suggestions": [
    {"id": 12, "name": "Ăn uống", "confidence": 95}
  ],
  "missing_fields": [],
  "warning": null
}
```

Logic xử lý số tiền tiếng Việt được hardcode trong system prompt:
- `"220k" / "220 nghìn" / "220 ngàn"` → `220000`
- `"1 triệu rưỡi" / "1.5 triệu"` → `1500000`
- `"2 trăm rưỡi"` → `250000`
- `"1 triệu 2"` → `1200000`

Quy tắc ngày: `"hôm nay"`, `"hôm qua"`, `"tối qua"`, `"sáng qua"` được resolve bằng `datetime.today()` của server.

**Cảnh báo tự động (post-parse):** Nếu số tiền chi vượt tổng số dư → trả về `warning` để UI hiển thị bong bóng đỏ trước khi mở `TransactionConfirmCard`.

#### B. `POST /api/v1/chat/parse-savings` – Trích xuất nạp/rút tiết kiệm

Người dùng gõ: *"nạp 500k vào quỹ mua laptop"* → JSON:

```json
{
  "action": "deposit",
  "amount": 500000,
  "date": "2026-05-08",
  "note": "nạp quỹ laptop",
  "goal_suggestions": [
    {"id": 3, "name": "Mua Laptop", "confidence": 92}
  ],
  "missing_fields": [],
  "warning": null
}
```

Backend tự động **cap** số tiền và phát warning nếu:
- `deposit` vượt `remaining = target − saved` của mục tiêu hoặc vượt số dư tài khoản.
- `withdraw` vượt `saved_amount` đã tích lũy.

Mapping động từ → action:
- `"nạp" / "gửi" / "bỏ vào" / "để vào" / "tiết kiệm thêm"` → `"deposit"`
- `"rút" / "lấy ra" / "rút ra" / "lấy từ"` → `"withdraw"`

#### C. `POST /api/v1/chat/parse-receipt` – OCR ảnh hoá đơn (multimodal)

Đây là pipeline phức tạp nhất, kết hợp **Vision LLM + NLP**:

```
Ảnh JPG/PNG (base64)
        │
        ▼
[1] Groq Vision (LLaMA 4 Scout)  →  {merchant, date, total_amount, items[], raw_text}
        │
        ▼
[2] _parse_ocr_amount() / _parse_ocr_date()  →  chuẩn hoá VND & YYYY-MM-DD
        │
        ▼
[3] Groq LLaMA 3.3 70B  →  gợi ý top-3 category dựa trên (merchant + items)
        │
        ▼
[4] _assess_ocr_quality()  →  confidence_level ∈ {high, medium, low} + warnings[]
        │
        ▼
OCRReceiptResponse  →  ReceiptConfirmCard (kèm ảnh gốc để zoom)
```

Response gồm `amount`, `merchant_name`, `date`, `raw_text` (toàn bộ text trích từ ảnh – để minh bạch), `items[]` (line items), `category_suggestions[]`, và `confidence_level` để UI tô màu cảnh báo.

### 3.4. Endpoint chat hội thoại tự do

`POST /api/v1/chat` — trợ lý tài chính giới hạn domain. Khác với 3 endpoint trên, ở đây dùng `temperature=0.7` và **không** trả JSON. System prompt:

1. Inject `_get_financial_context()` gồm: tổng số dư, thu/chi tháng này, danh sách tài khoản, **10 giao dịch gần nhất** kèm category.
2. Cấm trả lời ngoài chủ đề tài chính (tin tức, thể thao, giải trí…) — từ chối ngắn gọn 1 câu.
3. Yêu cầu xuống dòng `\n` giữa các giao dịch khi liệt kê (tránh text dán liền).
4. Giữ tối đa 10 turn lịch sử để tránh tràn token.

### 3.5. Tích hợp UI – `ChatScreen` (mobile + web)

`ChatScreen.js` (React Native) và `ChatScreen.tsx` (Next.js) chia sẻ cùng một mô hình message:

```js
{ id, role: 'user'|'assistant', content, type?: 'card'|'savings-card'|'receipt-card', parsed?: {...} }
```

3 chế độ điều khiển bằng state flags:

| Flag | Trigger UI | Endpoint gọi | Component render |
|---|---|---|---|
| `nlpMode` | Nút **"Ghi chi tiêu"** | `parseTransaction()` | `TransactionConfirmCard` |
| `savingsMode` | Nút **"Nạp/rút tiết kiệm"** | `parseSavingsAction()` | `SavingsConfirmCard` |
| `ocrMode` | Nút **"Quét hoá đơn"** (chọn ảnh) | `parseReceipt(base64)` | `ReceiptConfirmCard` |
| (mặc định) | Gõ tự do | `sendChatMessage()` | Bong bóng text |

Sau khi user xác nhận trên card → component gọi thẳng API tạo giao dịch (`createExpense` / `createIncome` / `depositToGoal` / `withdrawFromGoal`) → message được đánh dấu `confirmed: true` và đổi nội dung thành `"✅ Giao dịch đã được lưu thành công!"`.

### 3.6. Bảo mật & Lưu ý vận hành

- Backend yêu cầu **JWT bắt buộc** trên mọi endpoint chat (`Depends(get_current_user)`) — không có route public.
- Mọi prompt chỉ inject `user_id` của người gọi → LLM không thấy dữ liệu user khác.
- Nếu thiếu `GROQ_API_KEY` trong `.env`, mọi endpoint chat sẽ trả `BadRequestError` ngay từ service (không crash server).
- LLM **không** được phép tự ghi DB — luôn phải qua bước `ConfirmCard` ở phía client. Đây là rào chắn chống hallucination.
- File code chính cần biết:
  - [`finance-backend-api/app/modules/chat/service.py`](finance-backend-api/app/modules/chat/service.py) – toàn bộ logic LLM/NLP/OCR
  - [`finance-backend-api/app/modules/chat/router.py`](finance-backend-api/app/modules/chat/router.py) – 4 route
  - [`mobile-app/src/screens/ChatScreen.js`](mobile-app/src/screens/ChatScreen.js) & [`frontend-next/src/screens/ChatScreen.tsx`](frontend-next/src/screens/ChatScreen.tsx) – UI hội thoại
  - [`mobile-app/src/components/TransactionConfirmCard.js`](mobile-app/src/components/TransactionConfirmCard.js), [`SavingsConfirmCard.js`](mobile-app/src/components/SavingsConfirmCard.js), [`ReceiptConfirmCard.js`](mobile-app/src/components/ReceiptConfirmCard.js) – các thẻ xác nhận

