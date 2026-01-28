# financial-management
1. Thành viên 1: Nền tảng & Quản lý người dùng (System & Auth)
Thành viên này đóng vai trò "xây nền", đảm bảo hệ thống chạy ổn định và an toàn.

Nhiệm vụ chính:

Thiết lập dự án (Project Setup): Khởi tạo cấu trúc source code, cấu hình Database, Docker (nếu dùng), cấu hình các biến môi trường.

Hệ thống xác thực (Chức năng số 5 trong ảnh):

API Đăng ký (Register), Đăng nhập (Login).

Xử lý bảo mật (JWT/Session), mã hóa mật khẩu.

Middleware/Filter để kiểm tra quyền truy cập cho các API của 2 thành viên còn lại.

Quản lý thông tin User: API xem/sửa thông tin cá nhân (Profile).

Lý do: Phần này ít API hơn nhưng độ phức tạp về bảo mật cao, cần người cẩn thận làm nền tảng cho 2 bạn kia tích hợp vào.

2. Thành viên 2: Nghiệp vụ cốt lõi (Core Transaction)
Thành viên này sẽ làm việc trực tiếp với dữ liệu "sống" của ứng dụng.

Nhiệm vụ chính:

Quản lý danh mục (Chức năng số 2):

Thiết kế bảng Database cho Category (Ăn uống, Di chuyển...).

API CRUD (Tạo, Xem, Sửa, Xóa) danh mục.

Quản lý thu chi (Chức năng số 1):

API nhập khoản thu/chi (kèm validation dữ liệu đầu vào).

API sửa/xóa giao dịch.

Xử lý logic ràng buộc: Ví dụ, khi xóa danh mục thì các giao dịch thuộc danh mục đó xử lý ra sao?

Lý do: Hai chức năng này liên quan mật thiết (giao dịch phải thuộc về danh mục), nên để 1 người làm sẽ dễ xử lý logic và thiết kế quan hệ bảng (Foreign Keys) trong Database.

3. Thành viên 3: Phân tích & Báo cáo (Analytics & Dashboard)
Thành viên này tập trung vào việc truy vấn và tổng hợp dữ liệu (Query & Aggregation).

Nhiệm vụ chính:

Tính toán số dư (Chức năng số 4):

Viết logic tính tổng thu, tổng chi.

API lấy số dư hiện tại (hoặc theo khoảng thời gian cụ thể).

Thống kê trực quan (Chức năng số 3):

API trả về dữ liệu để Frontend vẽ biểu đồ (ví dụ: trả về JSON dạng { "category": "Ăn uống", "amount": 500000 }).

Lọc dữ liệu thống kê theo ngày/tuần/tháng/năm.

Lý do: Phần này đòi hỏi kỹ năng viết câu lệnh truy vấn (SQL/Query) phức tạp hơn để tối ưu hiệu năng. Tách riêng ra giúp code báo cáo không ảnh hưởng đến code xử lý giao dịch hàng ngày.
