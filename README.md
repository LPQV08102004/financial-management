# Financial Management System

Hệ thống quản lý tài chính cá nhân theo mô hình **zero-based budgeting** (lấy cảm hứng từ YNAB), cho phép người dùng phân bổ toàn bộ thu nhập vào các danh mục chi tiêu, theo dõi giao dịch, phân tích báo cáo và nhận gợi ý từ AI.

---

## Thành viên nhóm

| Thành viên | Vai trò |
|------------|---------|
| Toản | Auth, quản lý người dùng, JWT, cấu hình hệ thống |
| Việt | Giao dịch, danh mục, nghiệp vụ cốt lõi |
| Triết | Phân tích, báo cáo, thống kê dashboard |
| Masao | Thiết kế UX/UI (mobile & web) |

---

## Kiến trúc tổng quan

```
financial-management/
├── finance-backend-api/   # FastAPI + MySQL (Python 3.11)
├── frontend-next/         # Next.js 16 web app (TypeScript + Tailwind CSS 4)
├── mobile-app/            # Expo React Native (iOS & Android)
└── admin-panel/           # React + Vite admin dashboard
```

---

## Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0, PyMySQL, Alembic, JWT, Groq AI |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Mobile | Expo ~55, React Native, React Navigation |
| Admin | React 18, Vite, Tailwind CSS 3 |
| Database | MySQL 8 |
| Container | Docker, Docker Compose |

---

## Yêu cầu hệ thống

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (khuyến nghị cho backend)
- npm hoặc yarn

---

## Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/LPQV08102004/financial-management.git
cd financial-management
```

---

### 2. Backend (`finance-backend-api/`)

#### Cài đặt bằng Docker (khuyến nghị)

```bash
cd finance-backend-api

# Sao chép file cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env: DATABASE_URL, SECRET_KEY, GROQ_API_KEY

# Khởi chạy MySQL (port 3307) + API (port 8000)
docker-compose up --build
```

#### Cài đặt thủ công

```bash
cd finance-backend-api

pip install -r requirements.txt

cp .env.example .env
# Chỉnh sửa .env

# Chạy migration database
alembic upgrade head

# Khởi chạy server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Biến môi trường cần thiết (`.env`)

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | SQLAlchemy MySQL URL, ví dụ: `mysql+pymysql://user:pass@localhost:3307/db` |
| `SECRET_KEY` | Khóa bí mật để ký JWT |
| `GROQ_API_KEY` | API key Groq cho trợ lý AI (tuỳ chọn) |
| `CORS_ORIGINS` | JSON array các origin cho phép, mặc định: `["http://localhost:3000","http://localhost:5173"]` |

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Web App (`frontend-next/`)

```bash
cd frontend-next

npm install

# (Tuỳ chọn) Tạo file .env.local nếu backend không ở localhost:8000
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)

> **Lưu ý:** Nếu gặp lỗi liên quan đến `turbopack.root` trong `next.config.ts`, hãy cập nhật đường dẫn cho đúng với máy của bạn, hoặc xóa dòng đó và dùng flag `--webpack` (đã là mặc định trong script `dev`).

---

### 4. Mobile App (`mobile-app/`)

```bash
cd mobile-app

npm install

# Chạy Expo dev server
npm start

# Hoặc chạy trực tiếp trên từng nền tảng
npm run android   # Android emulator / thiết bị thật
npm run ios       # iOS simulator (cần macOS)
```

> Backend URL được tự động phát hiện qua LAN khi dùng thiết bị thật. Có thể ghi đè bằng biến môi trường `EXPO_PUBLIC_API_BASE_URL`.

---

### 5. Admin Panel (`admin-panel/`)

```bash
cd admin-panel

npm install
npm run dev
```

Truy cập: [http://localhost:5173](http://localhost:5173)

> Yêu cầu tài khoản có quyền admin trên hệ thống.

---

## Thứ tự khởi chạy khuyến nghị

1. **Backend** — khởi chạy trước, đảm bảo MySQL đang chạy
2. **Web / Mobile / Admin** — khởi chạy sau khi backend sẵn sàng

---

## Tính năng chính

- **Zero-based budgeting**: phân bổ toàn bộ thu nhập vào danh mục, theo dõi ngân sách theo tháng
- **Quản lý giao dịch**: thu nhập, chi tiêu, chuyển khoản, giao dịch chia nhỏ (split)
- **Tài khoản**: ngân hàng, tiền mặt, thẻ tín dụng
- **Mục tiêu tiết kiệm**: đặt mục tiêu, nạp/rút tiền, theo dõi tiến độ
- **Giao dịch định kỳ**: tự động nhắc nhở và xử lý
- **Phân tích & báo cáo**: biểu đồ thu chi, thống kê theo tháng/danh mục
- **Thông báo & nhắc nhở**: cảnh báo vượt ngân sách, nhắc giao dịch định kỳ
- **Trợ lý AI**: phân tích tài chính và nhập giao dịch bằng ngôn ngữ tự nhiên (Groq)
- **Đồng bộ đa nền tảng**: web và mobile cùng kết nối một backend

---

## License

MIT
