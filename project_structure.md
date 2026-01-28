Cấu trúc thư mục mẫu cho phát triển backend

finance-backend-api/
├── app/
│   ├── main.py                     # (TV1) File tổng, gom API của 3 người lại
│   ├── core/                       # (TV1) Cấu hình hệ thống
│   │   ├── config.py               # Biến môi trường, DB URL
│   │   └── security.py             # Logic JWT, Hash pass
│   │
│   ├── db/                         # (TV1) Database Config
│   │   └── session.py
│   │
│   │   # --- KHU VỰC CHIA VIỆC RÕ RÀNG ---
│   ├── modules/
│   │   ├── auth/                   # (TV1 - System & User)
│   │   │   ├── router.py           # API Login, Register, Profile
│   │   │   ├── models.py           # Bảng User
│   │   │   └── schemas.py          # Quy định dữ liệu Input/Output User
│   │   │
│   │   ├── transactions/           # (TV2 - Core Logic)
│   │   │   ├── router.py           # API Thu/Chi, Danh mục
│   │   │   ├── models.py           # Bảng Transaction, Category
│   │   │   └── schemas.py          # Input/Output tiền nong
│   │   │
│   │   └── analytics/              # (TV3 - Data/Report)
│   │       ├── router.py           # API Báo cáo, Thống kê
│   │       ├── services.py         # (Quan trọng) Code Pandas xử lý số liệu ở đây
│   │       └── schemas.py          # Định nghĩa JSON trả về cho biểu đồ
│   │
│   └── shared/                     # (Tùy chọn) Các hàm tiện ích dùng chung
│
├── tests/                          # Folder test
├── requirements.txt
├── Dockerfile
└── docker-compose.yml              # Chỉ chạy DB và Backend, không cần Flutter
