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
