# 🚀 QUICK REFERENCE GUIDE - TOẢN AUTH SYSTEM

## ⚡ 30-Second Startup

```bash
# Terminal 1: Start Backend
cd finance-backend-api
docker-compose up -d
# Backend ready at: http://127.0.0.1:8000

# Terminal 2: Start Mobile App
cd mobile-app
npm start
# QR Code appears - scan with Expo app or press 'w' for web
```

---

## 📊 API ENDPOINTS (5 REQUIRED)

### 1️⃣ Register - Create New Account
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "User Name",
  "password": "SecurePass123!",
  "phone_number": "0123456789"
}

Response 200:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "User Name",
    "phone_number": "0123456789",
    "avatar_url": null,
    "is_active": true,
    "created_at": "2024-05-01T...",
    "updated_at": "2024-05-01T..."
  }
}
```

### 2️⃣ Login - Authenticate User
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200: (same as register response with tokens)
```

### 3️⃣ Get Profile - View Current User
```
GET /api/v1/users/me
Authorization: Bearer {access_token}

Response 200:
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "User Name",
  "phone_number": "0123456789",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "created_at": "2024-05-01T...",
  "updated_at": "2024-05-01T..."
}
```

### 4️⃣ Update Profile - Edit User Info
```
PATCH /api/v1/users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "New Name",
  "phone_number": "0987654321",
  "avatar_url": "data:image/png;base64,iVBORw0KGgoAAAAN..."
}

Response 200: (updated user object)
```

### 5️⃣ Change Password - Secure Password Update
```
POST /api/v1/users/me/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "confirm_password": "NewPass123!"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

---

## 🔒 PASSWORD REQUIREMENTS

✅ Valid Password Must Have:
- 8+ characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&*)

❌ Invalid Examples:
- `password` - no uppercase, digit, special char
- `Pass123` - no special char
- `Pass!` - too short
- `PASSWORD123!` - no lowercase

✅ Valid Examples:
- `SecurePass123!`
- `TestPass@456`
- `MyApp#1234`

---

## 📱 MOBILE APP SCREENS

### Login Screen
- Email input (validation: RFC 5322)
- Password input (masked)
- Password requirements display
- Register button
- Error messages from backend

### Registration Form
- Full Name field
- Email field
- Phone Number field (optional)
- Password field with requirements
- Register button

### Profile Screen
- Avatar display (emoji placeholder)
- User info (email, name, phone)
- Edit Avatar button ✏️ → EditProfileScreen
- Edit Profile button → EditProfileScreen
- Change Password button → ChangePasswordScreen
- Logout button

### Edit Profile Screen (NEW)
- Avatar preview
- Avatar picker (camera or gallery)
- Full Name input
- Phone Number input
- Save button
- Cancel button

### Change Password Screen
- Current Password input
- New Password input
- Confirm Password input
- Change button

---

## 🔑 JWT TOKEN FORMAT

### Access Token (1 hour)
- Used for all API requests
- Sent in: `Authorization: Bearer {token}`
- Expires after 1 hour
- Get new one by logging in again

### Refresh Token (7 days)
- Stored securely in AsyncStorage
- Used to get new access token (if implemented)
- Revoked on logout
- Revoked when password changes

---

## ⚙️ DATABASE SCHEMA

### User Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(30) NULL,
  avatar_url VARCHAR(500) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

### RefreshToken Table
```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT NOW()
);
```

---

## 🔍 ERROR CODES & RESPONSES

### 200 OK
Request successful, response body contains data

### 400 Bad Request
```json
{"detail": "Passwords do not match"}
{"detail": "Current password is incorrect"}
```

### 401 Unauthorized
```json
{"detail": "Could not validate credentials"}
{"detail": "Invalid authentication credentials"}
```

### 409 Conflict
```json
{"detail": "Email already registered"}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "type": "value_error.email",
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "input": "invalid-email"
    }
  ]
}
```

---

## 🧪 TEST WITH CURL

### Register
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "TestPass123!",
    "phone_number": "0123456789"
  }'
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Get Profile
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
curl -X GET http://127.0.0.1:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Update Profile
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
curl -X PATCH http://127.0.0.1:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "New Name",
    "phone_number": "0987654321"
  }'
```

### Change Password
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
curl -X POST http://127.0.0.1:8000/api/v1/users/me/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPass123!",
    "new_password": "NewPass123!",
    "confirm_password": "NewPass123!"
  }'
```

---

## 🛠️ TROUBLESHOOTING

### Backend not starting?
```bash
# Check if Docker is running
docker ps

# Check logs
docker logs finance_api

# Restart
docker-compose down
docker-compose up -d
```

### Port already in use?
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID {PID} /F

# Kill process on port 8081 (Expo)
netstat -ano | findstr :8081
taskkill /PID {PID} /F
```

### Database connection failed?
```bash
# Check MySQL is running
docker logs finance_mysql

# Check credentials in .env
cat finance-backend-api/.env | grep DATABASE

# Check database exists
docker exec finance_mysql mysql -ufinuser -pfinpass -e "SHOW DATABASES;"
```

### Mobile app won't connect?
1. Check backend is running: `http://127.0.0.1:8000/`
2. Check network connection (WiFi/LAN)
3. Try different API base URL:
   - `192.168.1.13:8000` (your IP)
   - `10.0.2.2:8000` (Android emulator)
   - `127.0.0.1:8000` (localhost)

---

## ✅ VERIFICATION CHECKLIST

Before team submission, verify:

- [x] Backend Docker containers running
- [x] MySQL database accessible
- [x] All 5 auth endpoints working
- [x] JWT tokens generate correctly
- [x] User isolation enforced (can't access other users' data)
- [x] Password hashing works (bcrypt)
- [x] Error handling returns correct status codes
- [x] Mobile app connects to backend
- [x] Registration works on mobile
- [x] Login works on mobile
- [x] Profile editing works
- [x] Avatar upload works
- [x] Password change works
- [x] Logout works

---

## 📞 CONTACT & NOTES

**Implementation Status**: ✅ COMPLETE

**All Files Modified**:
- `finance-backend-api/app/main.py` - FastAPI app
- `finance-backend-api/app/core/security.py` - JWT & password
- `finance-backend-api/app/shared/dependencies.py` - Middleware
- `finance-backend-api/app/modules/auth/` - Auth endpoints
- `finance-backend-api/app/modules/users/` - Profile endpoints
- `mobile-app/src/screens/EditProfileScreen.js` - NEW
- `mobile-app/App.js` - Navigation config
- `mobile-app/src/api/authApi.js` - API integration

**Ready for**: 
- ✅ Production deployment
- ✅ Team code review
- ✅ Other modules integration
- ✅ Security audit

**Next Team Member**: Start implementing finance APIs (transactions, budgets, categories) using the same `get_current_user` middleware pattern.

---

Generated: May 1, 2026  
Status: ✅ READY FOR TEAM SUBMISSION
