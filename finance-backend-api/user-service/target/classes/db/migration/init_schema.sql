-- Create database
CREATE DATABASE IF NOT EXISTS finance_user_db;
USE finance_user_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  fullname VARCHAR(255) NOT NULL COMMENT 'Tên người dùng',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email',
  sdt VARCHAR(20) COMMENT 'Số điện thoại',
  password VARCHAR(255) NOT NULL COMMENT 'Mật khẩu (encrypted)',
  role ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Vai trò người dùng',
  is_active BOOLEAN NOT NULL DEFAULT true COMMENT 'Trạng thái hoạt động',
  last_login_at TIMESTAMP NULL COMMENT 'Lần đăng nhập cuối',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  deleted_at TIMESTAMP NULL COMMENT 'Ngày xóa (soft delete)',
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng người dùng';

-- Insert default admin user (password: admin123)
INSERT INTO users (id, fullname, email, sdt, password, role, is_active) VALUES
(
  'admin-001',
  'Admin User',
  'admin@example.com',
  '0901234567',
  '$2a$10$6mvj7rJPa2f6uSCctT7Nj.H.F.MF75KQPXLQMQWkMWDHfXHzHHlzS', -- BCrypt hash of "admin123"
  'ADMIN',
  true
);

-- Insert sample customer users
INSERT INTO users (id, fullname, email, sdt, password, role, is_active) VALUES
(
  'customer-001',
  'John Doe',
  'john@example.com',
  '0912345678',
  '$2a$10$eImiTXuWVxfaHNYY8Jt1KenMaAkF8bT7InbfPKJJpW3h7vxROTlmq', -- BCrypt hash of "password123"
  'CUSTOMER',
  true
),
(
  'customer-002',
  'Jane Smith',
  'jane@example.com',
  '0987654321',
  '$2a$10$eImiTXuWVxfaHNYY8Jt1KenMaAkF8bT7InbfPKJJpW3h7vxROTlmq', -- BCrypt hash of "password123"
  'CUSTOMER',
  true
);
