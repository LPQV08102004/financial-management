# User Service Testing Guide

## Prerequisites
- Maven installed and configured
- MySQL running on localhost:3306
- Database initialized with init_schema.sql
- Java 21 or later

---

## Quick Start

### 1. Build the Project
```bash
cd backend/user-service
mvn clean install
```

### 2. Run the Application
```bash
mvn spring-boot:run
```

The service will start at: **http://localhost:8081**

You should see output like:
```
[main] c.c.u.UserServiceApplication : Started UserServiceApplication in 5.234 seconds
```

---

## Test the API Endpoints

### Option 1: Using cURL (Command Line)

#### Test 1: Admin Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMi...",
    "refreshToken": "eyJhbGciOiJIUzUxMi...",
    "user": {
      "id": "admin-001",
      "fullname": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### Test 2: Customer Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' | jq .
```

#### Test 3: Get User Profile (Requires Token)
```bash
# First, get the token from login response above
# Replace ADMIN_ACCESS_TOKEN with actual token

curl -X GET http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" | jq .
```

#### Test 4: Admin List Users
```bash
# Use admin token from Test 1

curl -X GET "http://localhost:8081/api/admin/users?page=0&size=10" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" | jq .
```

#### Test 5: Customer Try to Access Admin Endpoint (Should Fail)
```bash
# Use customer token - should get 403 Forbidden

curl -X GET "http://localhost:8081/api/admin/users?page=0&size=10" \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN" | jq .
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access Denied",
  "timestamp": 1711798523
}
```

#### Test 6: Signup New User
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@example.com",
    "password":"SecurePass123",
    "fullname":"New User",
    "sdt":"0987654321"
  }' | jq .
```

#### Test 7: Update Profile
```bash
# Use token from Test 1

curl -X PUT http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname":"Updated Fullname",
    "sdt":"0911111111"
  }' | jq .
```

#### Test 8: Change Password
```bash
curl -X POST http://localhost:8081/api/users/change-password \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword":"admin123",
    "newPassword":"NewPassword456",
    "confirmPassword":"NewPassword456"
  }' | jq .
```

#### Test 9: Refresh Token
```bash
# Use refresh token from login response

curl -X POST http://localhost:8081/api/auth/refresh-token \
  -H "Authorization: Bearer REFRESH_TOKEN" | jq .
```

#### Test 10: Invalid Token (Should Fail)
```bash
curl -X GET http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer invalid-token-here" | jq .
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired JWT token",
  "timestamp": 1711798523
}
```

---

### Option 2: Using Postman

#### Setup Collection
1. **Open Postman**
2. **Create New Collection:** "User Service API"

#### Create Requests

**Request 1: Admin Login**
- Method: `POST`
- URL: `http://localhost:8081/api/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw):
  ```json
  {
    "email":"admin@example.com",
    "password":"admin123"
  }
  ```
- **Send** and copy the `accessToken` value

**Request 2: Get Profile**
- Method: `GET`
- URL: `http://localhost:8081/api/users/profile`
- Headers:
  ```
  Authorization: Bearer {accessToken}
  ```
- **Send**

**Request 3: List Users (Admin)**
- Method: `GET`
- URL: `http://localhost:8081/api/admin/users?page=0&size=10`
- Headers:
  ```
  Authorization: Bearer {accessToken}
  ```
- **Send**

**Request 4: Update Profile**
- Method: `PUT`
- URL: `http://localhost:8081/api/users/profile`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}
  ```
- Body (raw):
  ```json
  {
    "fullname":"New Full Name",
    "sdt":"0999999999"
  }
  ```
- **Send**

**Request 5: Signup New User**
- Method: `POST`
- URL: `http://localhost:8081/api/auth/signup`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw):
  ```json
  {
    "email":"test@example.com",
    "password":"TestPass123",
    "fullname":"Test User",
    "sdt":"0912345678"
  }
  ```
- **Send**

---

### Option 3: Using REST Client Extension (VS Code)

Create a file `test.http`:

```http
# Admin Login
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

### Get Profile (replace token with actual)
GET http://localhost:8081/api/users/profile
Authorization: Bearer eyJhbGciOiJIUzUxMi...

### List Users (Admin)
GET http://localhost:8081/api/admin/users?page=0&size=10
Authorization: Bearer eyJhbGciOiJIUzUxMi...

### Signup New User
POST http://localhost:8081/api/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "fullname": "New User",
  "sdt": "0987654321"
}

### Update Profile
PUT http://localhost:8081/api/users/profile
Authorization: Bearer eyJhbGciOiJIUzUxMi...
Content-Type: application/json

{
  "fullname": "Updated Full Name",
  "sdt": "0999999999"
}

### Change Password
POST http://localhost:8081/api/users/change-password
Authorization: Bearer eyJhbGciOiJIUzUxMi...
Content-Type: application/json

{
  "oldPassword": "admin123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}

### Refresh Token (replace with actual refresh token)
POST http://localhost:8081/api/auth/refresh-token
Authorization: Bearer refresh-token-here

### Logout
POST http://localhost:8081/api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzUxMi...

### Test Invalid Token (should return 401)
GET http://localhost:8081/api/users/profile
Authorization: Bearer invalid-token
```

Save this file and click "Send Request" above each HTTP block.

---

## Validation Testing

### Test 1: Invalid Email Format
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"invalid-email",
    "password":"Pass123",
    "fullname":"User",
    "sdt":"0912345678"
  }' | jq .
```

**Expected:** 400 Bad Request with validation error

### Test 2: Password Too Short
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"123",
    "fullname":"User",
    "sdt":"0912345678"
  }' | jq .
```

**Expected:** 400 Bad Request - password must be 6+ characters

### Test 3: Duplicate Email
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"NewPass123",
    "fullname":"Another Admin",
    "sdt":"0912345678"
  }' | jq .
```

**Expected:** 400 Bad Request - email already exists

### Test 4: Wrong Password at Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"wrongpassword"
  }' | jq .
```

**Expected:** 401 Unauthorized - Invalid credentials

### Test 5: User Not Found
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nonexistent@example.com",
    "password":"anypassword"
  }' | jq .
```

**Expected:** 401 Unauthorized - Invalid credentials

---

## Integration Test Scenario

### Complete User Lifecycle

**Step 1: Signup**
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"lifecycle@example.com",
    "password":"LifecyclePass123",
    "fullname":"Lifecycle User",
    "sdt":"0912345678"
  }'
```

**Step 2: Login**
```bash
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lifecycle@example.com","password":"LifecyclePass123"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

**Step 3: Get Profile**
```bash
curl -X GET http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Step 4: Update Profile**
```bash
curl -X PUT http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname":"Lifecycle User Updated",
    "sdt":"0987654321"
  }' | jq .
```

**Step 5: Change Password**
```bash
curl -X POST http://localhost:8081/api/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword":"LifecyclePass123",
    "newPassword":"NewLifecyclePass123",
    "confirmPassword":"NewLifecyclePass123"
  }' | jq .
```

**Step 6: Login with New Password**
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"lifecycle@example.com",
    "password":"NewLifecyclePass123"
  }' | jq .
```

---

## Expected Results Summary

| Test | Expected Status | Expected Result |
|------|-----------------|-----------------|
| Admin Login | 200 OK | Returns accessToken, refreshToken |
| Customer Login | 200 OK | Returns accessToken, refreshToken |
| Get Profile (with token) | 200 OK | Returns user data |
| Get Profile (no token) | 401 | Unauthorized error |
| List Users (admin) | 200 OK | Paginated user list |
| List Users (customer) | 403 | Forbidden error |
| Signup (valid) | 201 Created | Returns new user data |
| Signup (duplicate email) | 400 | Email already exists |
| Invalid email signup | 400 | Validation error |
| Update Profile | 200 OK | Returns updated user |
| Change Password | 200 OK | Password changed |
| Wrong credentials | 401 | Invalid credentials |
| Invalid Token | 401 | Invalid JWT |
| Refresh Token | 200 OK | Returns new tokens |

---

## Debugging Tips

### Check if Service is Running
```bash
curl http://localhost:8081/actuator/health 2>/dev/null || echo "Service not running"
```

### View Recent Logs
```bash
# If using Maven
mvn spring-boot:run 2>&1 | tail -20

# If using JAR
java -jar target/user-service-1.0.0.jar 2>&1 | tail -20
```

### Test Database Connection
```bash
mysql -u root -p user_service_db -e "SELECT COUNT(*) FROM users;"
```

### Decode JWT Token (online tool)
Visit https://jwt.io and paste the token to see its contents

### Common Errors

**Error: "Connection refused"**
- Make sure MySQL is running
- Check database name in application.yml

**Error: "Invalid signature"**
- JWT secret was changed
- Token was issued by different service

**Error: "Validation failed for argument"**
- Check request body format
- Verify @Valid annotations are working

---

## Performance Notes

- All endpoints should respond in < 100ms
- Database queries optimized with indexes
- Token validation is fast (cryptographic validation only)
- No database hits for public /health endpoint

## What to Do Next

After testing:
1. ✅ All tests pass → Service is ready
2. Update frontend to call User Service API
3. Implement token storage in frontend (localStorage/cookies)
4. Test API integration from frontend
5. Implement logout functionality
6. Set up CI/CD pipeline for automated testing
