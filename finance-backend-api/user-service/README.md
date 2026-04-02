# User Service - Documentation

## Overview
A complete User Management Service built with Spring Boot, providing authentication, authorization, and user management features with JWT-based security.

## Quick Start

### Prerequisites
- Java 21
- Maven
- MySQL 8.0+

### Setup

1. **Create Database**
   ```bash
   mysql -u root -p < src/main/resources/db/migration/init_schema.sql
   ```

2. **Update Application Configuration**
   Edit `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/user_service_db
       username: root (change if needed)
       password: root (change if needed)
   
   jwt:
     secret: your-super-secret-key-min-32-characters (CHANGE THIS!)
   ```

3. **Run the Application**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

Service will start on `http://localhost:8081`

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. **Signup**
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullname": "John Doe",
  "sdt": "0912345678"
}

Response:
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản",
  "data": {
    "id": "uuid",
    "fullname": "John Doe",
    "email": "user@example.com",
    "sdt": "0912345678",
    "role": "customer",
    "isActive": true,
    "createdAt": "2024-03-30T12:00:00"
  }
}
```

#### 2. **Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMi...",
    "refreshToken": "eyJhbGciOiJIUzUxMi...",
    "user": {
      "id": "uuid",
      "fullname": "John Doe",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

#### 3. **Refresh Token**
```bash
POST /api/auth/refresh-token
Authorization: Bearer {refreshToken}

Response:
{
  "success": true,
  "message": "Token làm mới thành công",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "user": {...}
  }
}
```

#### 4. **Verify Email** (TODO)
```bash
POST /api/auth/verify-email?token=verification-token
```

#### 5. **Forgot Password** (TODO)
```bash
POST /api/auth/forgot-password?email=user@example.com
```

#### 6. **Reset Password** (TODO)
```bash
POST /api/auth/reset-password?token=reset-token&newPassword=newPassword123
```

---

### Protected Endpoints (Authentication Required)

#### 1. **Get Profile**
```bash
GET /api/users/profile
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Lấy thông tin thành công",
  "data": {
    "id": "uuid",
    "fullname": "John Doe",
    "email": "user@example.com",
    "sdt": "0912345678",
    "role": "customer",
    "isActive": true
  }
}
```

#### 2. **Update Profile**
```bash
PUT /api/users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fullname": "John Updated",
  "sdt": "0987654321"
}

Response:
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "data": {...}
}
```

#### 3. **Change Password**
```bash
POST /api/users/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}

Response:
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

#### 4. **Logout**
```bash
POST /api/auth/logout
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### Admin Endpoints (Requires ADMIN Role)

#### 1. **List Users**
```bash
GET /api/admin/users?page=0&size=10
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Danh sách người dùng",
  "data": {
    "content": [...],
    "totalElements": 10,
    "totalPages": 1,
    "currentPage": 0
  }
}
```

#### 2. **Get User by ID**
```bash
GET /api/admin/users/{userId}
Authorization: Bearer {adminAccessToken}
```

#### 3. **Deactivate User**
```bash
PUT /api/admin/users/{userId}/deactivate
Authorization: Bearer {adminAccessToken}
```

#### 4. **Activate User**
```bash
PUT /api/admin/users/{userId}/activate
Authorization: Bearer {adminAccessToken}
```

#### 5. **Delete User**
```bash
DELETE /api/admin/users/{userId}
Authorization: Bearer {adminAccessToken}
```

---

## Default Credentials

### Admin User
```
Email: admin@example.com
Password: admin123
Role: admin
```

### Sample Customer Users
```
Email: john@example.com
Password: password123
Role: customer

Email: jane@example.com
Password: password123
Role: customer
```

---

## Database Schema

### users Table
```sql
- id (UUID, Primary Key)
- fullname (String, Required)
- email (String, Unique, Required)
- sdt (String, Phone number)
- password (String, Encrypted with BCrypt)
- role (ENUM: 'admin', 'customer')
- is_active (Boolean)
- last_login_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)
- deleted_at (DateTime, for soft delete)
```

---

## Security Features

✅ **Password Encryption**: BCrypt (strength 10)
✅ **JWT Authentication**: Access Token (15 min) + Refresh Token (7 days)
✅ **Role-Based Access Control**: ADMIN vs CUSTOMER
✅ **CORS Configuration**: Configured for localhost:3000 and 3001
✅ **Session Management**: Stateless (JWT-based)
✅ **Input Validation**: Server-side validation on all endpoints

---

## JWT Token Structure

### Access Token Claims
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Error Handling

All endpoints return standard response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "timestamp": 1234567890
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": 1234567890
}
```

### Common Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid/missing token
- `403 Forbidden`: No permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Configuration

### Key Properties (application.yml)

```yaml
# JWT Configuration
jwt:
  secret: your-secret-key (minimum 32 characters)
  access-token-expiration: 900000  # 15 minutes in ms
  refresh-token-expiration: 604800000  # 7 days in ms

# Database
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/user_service_db
    username: root
    password: root
  
  jpa:
    hibernate:
      ddl-auto: update  # or 'validate' in production

# Server
server:
  port: 8081
```

---

## Future Enhancements

- [ ] Email verification with OTP
- [ ] Password reset functionality
- [ ] Email-based password recovery
- [ ] Two-factor authentication
- [ ] OAuth2 integration (Google, Facebook)
- [ ] Token blacklist service
- [ ] Rate limiting
- [ ] API versioning
- [ ] API documentation (Swagger)

---

## Troubleshooting

### JWT Secret Too Short
```
Error: "The specified key size (xxx bits) is greater than the maximum allowed (256 bits)"
Solution: Use a secret key with minimum 32 characters
```

### CORS Issues
Check `SecurityConfig.java` corsConfigurationSource() method and allow your frontend URL

### Database Connection Failed
1. Ensure MySQL is running
2. Create database: `user_service_db`
3. Check credentials in `application.yml`

---

## License
MIT License

## Author
CNLTHD Development Team
