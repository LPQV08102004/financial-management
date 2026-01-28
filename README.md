# financial-management
## 1. Toản: Nền tảng & Quản lý người dùng (System & Auth)
-Thành viên này đóng vai trò "xây nền", đảm bảo hệ thống chạy ổn định và an toàn.

### Nhiệm vụ chính:

- Thiết lập dự án (Project Setup): Khởi tạo cấu trúc source code, cấu hình Database, Docker (nếu dùng), cấu hình các biến môi trường.

- Hệ thống xác thực :

+ API Đăng ký (Register), Đăng nhập (Login).

+ Xử lý bảo mật (JWT/Session), mã hóa mật khẩu.

+ Middleware/Filter để kiểm tra quyền truy cập cho các API của 2 thành viên còn lại.

+ Quản lý thông tin User: API xem/sửa thông tin cá nhân (Profile).



## 2. Việt: Nghiệp vụ cốt lõi (Core Transaction)
Thành viên này sẽ làm việc trực tiếp với dữ liệu "sống" của ứng dụng.

### Nhiệm vụ chính:

- Quản lý danh mục (Chức năng số 2):

+ Thiết kế bảng Database cho Category (Ăn uống, Di chuyển...).

+ API CRUD (Tạo, Xem, Sửa, Xóa) danh mục.

- Quản lý thu chi (Chức năng số 1):

+ API nhập khoản thu/chi (kèm validation dữ liệu đầu vào).

+ API sửa/xóa giao dịch.

+ Xử lý logic ràng buộc: Ví dụ, khi xóa danh mục thì các giao dịch thuộc danh mục đó xử lý ra sao?



## 3. Triết: Phân tích & Báo cáo (Analytics & Dashboard)
Thành viên này tập trung vào việc truy vấn và tổng hợp dữ liệu (Query & Aggregation).

### Nhiệm vụ chính:

- Tính toán số dư (Chức năng số 4):

+ Viết logic tính tổng thu, tổng chi.

+ API lấy số dư hiện tại (hoặc theo khoảng thời gian cụ thể).

- Thống kê trực quan (Chức năng số 3):

+ API trả về dữ liệu để Frontend vẽ biểu đồ (ví dụ: trả về JSON dạng { "category": "Ăn uống", "amount": 500000 }).

+ Lọc dữ liệu thống kê theo ngày/tuần/tháng/năm.

## . Masao: Thiết kế UX/UI
- Thiết kế front end tương tác của người dùng, có thể linh hoạt trên mobile và web desktop.


