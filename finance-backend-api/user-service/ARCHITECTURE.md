# User Service Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  - Login Page (/login)                                           │
│  - Profile Page (/profile)                                       │
│  - Admin Dashboard (/admin)                                      │
└──────────┬──────────────────────────────────────────────────────┘
           │
           │ HTTP/CORS (fetch)
           │ Port: 3000
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                User Service (Spring Boot 3.2)                    │
│                    Port: 8081 (localhost)                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Controllers (REST API)                                      │  │
│  │ - AuthController    (signup, login, logout, refresh)       │  │
│  │ - UserController    (profile, change password)             │  │
│  │ - AdminUserController (user management, pagination)        │  │
│  └─────────────────┬──────────────────────────┬───────────────┘  │
│                    │                          │                   │
│  ┌─────────────────↓──────────┐  ┌──────────↓──────────────────┐ │
│  │   Services (Business Logic) │  │  Security & JWT             │ │
│  │ - AuthService              │  │ - JwtTokenProvider           │ │
│  │ - UserService              │  │ - JwtAuthenticationFilter    │ │
│  │   * signup()               │  │ - SecurityConfig             │ │
│  │   * login()                │  │   * @PreAuthorize handling   │ │
│  │   * getProfile()           │  │   * CORS configuration       │ │
│  │   * updateProfile()        │  │   * Stateless sessions       │ │
│  │   * changePassword()       │  │                              │ │
│  └──────────────┬─────────────┘  └──────────┬──────────────────┘ │
│                 │                           │                    │
│  ┌──────────────↓────────────────────────────↓──────────────────┐ │
│  │            Repository (Data Access)                          │ │
│  │ - UserRepository                                             │ │
│  │   * findByEmail()                                            │ │
│  │   * findByIdAndDeletedAtIsNull()  (soft delete aware)        │ │
│  │   * existsByEmail()                                          │ │
│  └────────────────┬─────────────────────────────────────────────┘ │
│                   │                                                │
│  ┌────────────────↓─────────────────────────────────────────────┐ │
│  │           Exception Handling                                  │ │
│  │ - GlobalExceptionHandler (@RestControllerAdvice)             │ │
│  │   * UserAlreadyExistsException → 400                         │ │
│  │   * UserNotFoundException → 404                              │ │
│  │   * InvalidCredentialsException → 401                        │ │
│  │   * MethodArgumentNotValidException → 400 (with field info)  │ │
│  │   * Generic Exception → 500                                  │ │
│  └────────────────┬─────────────────────────────────────────────┘ │
│                   │                                                │
│                   ↓                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Entity Models (JPA)                                 │  │
│  │ - User (with UserRole enum: admin, customer)                │  │
│  │   Fields: id (UUID), fullname, email, sdt,                  │  │
│  │           password (encrypted), role, isActive,             │  │
│  │           lastLoginAt, createdAt, updatedAt, deletedAt      │  │
│  └────────────────┬─────────────────────────────────────────────┘ │
│                   │                                                │
└───────────────────┼────────────────────────────────────────────────┘
                    │
                    │ JDBC/SQL
                    │ Port: 3306
                    ↓
        ┌──────────────────────┐
        │   MySQL Database     │
        │ (user_service_db)    │
        │ - users table        │
        │ - indexes on email   │
        │ - soft delete via    │
        │   deleted_at column  │
        └──────────────────────┘
```

---

## Request/Response Flow

### 1. Login Flow
```
User submits login form
        ↓
POST /api/auth/login
  {email, password}
        ↓
AuthController.login()
        ↓
AuthService.login()
        ├─ UserService.getUserByEmail()
        │       ↓
        │   UserRepository.findByEmail()
        │       ↓
        │   Database query
        ├─ Check if user is active
        │
        ├─ UserService.validatePassword()
        │  └─ BCrypt.matches(inputPassword, hashedPassword)
        │
        ├─ Update user.lastLoginAt
        │
        └─ JwtTokenProvider.generateTokens()
           └─ Create JWT with {userId, email, role}
                       ↓
                   Return LoginResponse
                   {accessToken, refreshToken, user}
```

### 2. Protected Request Flow (with JWT)
```
Frontend stores JWT token
        ↓
Make API request: GET /api/users/profile
  Header: Authorization: Bearer eyJhbGciOiJIUzUxMi...
        ↓
JwtAuthenticationFilter.doFilterInternal()
        ├─ Extract token from Authorization header
        ├─ Remove "Bearer " prefix
        ├─ JwtTokenProvider.validateToken()
        │  ├─ Parse JWT signature
        │  ├─ Verify expiration
        │  └─ Extract claims (userId, email, role)
        ├─ Create UsernamePasswordAuthenticationToken
        │  └─ Set authorities: [ROLE_admin] or [ROLE_customer]
        └─ Set SecurityContext
                    ↓
         Continue to controller with authentication
                    ↓
      UserController.getProfile()
        ├─ @Secured or @PreAuthorize checks pass
        ├─ Extract userId from SecurityContext
        ├─ UserService.getProfile(userId)
        │   └─ UserRepository.findByIdAndDeletedAtIsNull()
        │       └─ Return cached data
        │
        ├─ Convert to UserDto
        └─ Return ApiResponse with user data
```

### 3. Admin-Only Request Flow
```
Make API request: GET /api/admin/users?page=0&size=10
  Header: Authorization: Bearer {adminToken}
        ↓
JwtAuthenticationFilter validates token
        └─ Sets SecurityContext with authorities
                    ↓
       AdminUserController.listUsers()
                    ↓
      @PreAuthorize("hasRole('ADMIN')")
        ├─ Spring Security checks authorities
        ├─ If user has ROLE_ADMIN → proceed
        └─ If user has ROLE_CUSTOMER → return 403 Forbidden
                    ↓
        AdminUserController calls UserService
                    ↓
      UserService.getUsersPaginated(page, size)
                    ↓
      Return paginated UserDto list
```

---

## JWT Token Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                      Login (POST /api/auth/login)               │
└────────────────────┬───────────────────────────────────────────┘
                     │
         Generate JWT tokens
         ↓
    ┌─────────────────────────────────────────┐
    │   Access Token (15 minutes)              │
    │   {userId, email, role, iat, exp}       │
    │   Used for: All API requests             │
    │   Stored: localStorage                   │
    └──────────┬────────────────────────────────┘
               │
         5 min before expiration
               │
               ↓ (Request with expired token)
         401 Unauthorized
               │
               ↓
    ┌────────────────────────────┐
    │ Refresh Token (7 days)      │
    │ {userId, email, role}       │
    │ Used for: Getting new tokens│
    │ Stored: localStorage        │
    └────────────────────────────┘
               │
     POST /api/auth/refresh-token
         (Authorization: Bearer refreshToken)
               │
               ↓
     Generate NEW Access Token
     + NEW Refresh Token
               │
               ↓
     Token rotation complete ✓
```

---

## Security Layers

```
Request enters system
        ↓
┌─ Layer 1: CORS Check ────────────────┐
│ Verify origin (localhost:3000/3001)  │
└──────────────┬──────────────────────┘
               ↓
┌─ Layer 2: JWT Extraction ────────────┐
│ Extract Bearer token from header     │
│ Return 400 if missing                │
└──────────────┬──────────────────────┘
               ↓
┌─ Layer 3: Token Validation ──────────┐
│ Verify signature (HMAC-SHA512)       │
│ Check expiration                     │
│ Return 401 if invalid                │
└──────────────┬──────────────────────┘
               ↓
┌─ Layer 4: Role Check ────────────────┐
│ Extract role from JWT claims         │
│ Set Spring Security authorities      │
│ Return 403 if insufficient           │
└──────────────┬──────────────────────┘
               ↓
┌─ Layer 5: Method Security ──────────┐
│ @PreAuthorize evaluates rules        │
│ Check @Secured, @RolesAllowed        │
│ Proceed if all checks pass           │
└──────────────┬──────────────────────┘
               ↓
         Access Granted ✓
```

---

## Data Flow: Signup

```
User fills signup form
{fullname, email, password, sdt}
        ↓
POST /api/auth/signup
        ↓
AuthController.signup()
        ├─ @Valid validates input
        │  ├─ @Email on email field
        │  ├─ @NotBlank on required fields
        │  └─ @Size on password
        │
        ├─ Validation fails → 400 + error details
        │
        └─ Validation passes → AuthService.signup()
                    ↓
                UserService.signup()
                    ├─ Check if email already exists
                    │  └─ UserRepository.existsByEmail()
                    │     └─ Database query
                    │
                    ├─ If exists → Throw UserAlreadyExistsException
                    │
                    ├─ Create new User entity
                    │  ├─ Generate UUID id
                    │  ├─ Encrypt password with BCrypt
                    │  ├─ Set role = CUSTOMER
                    │  └─ Set isActive = true
                    │
                    └─ UserRepository.save(user)
                            ↓
                        Database INSERT
                            ↓
                        Return UserDto
                            ↓
                        @ResponseStatus(201 Created)
                            ↓
                    Return ApiResponse to frontend
```

---

## Data Flow: Logout & Token Refresh

### Logout (Optional - Currently Placeholder)
```
POST /api/auth/logout
  Authorization: Bearer {accessToken}
        ↓
JwtAuthenticationFilter validates token
        ↓
AuthController.logout()
        ├─ Extract userId from SecurityContext
        ├─ Mark token as revoked (future: in token blacklist)
        └─ Return success response
              ↓
           Frontend deletes localStorage keys
```

### Token Refresh
```
Access token about to expire
        ↓
Frontend detects 401 response
        ↓
POST /api/auth/refresh-token
  Authorization: Bearer {refreshToken}
        ↓
JwtAuthenticationFilter validates refresh token
        ├─ Check it's still valid
        └─ Extract userId, email, role claims
        ↓
AuthService.refreshToken()
        ├─ JwtTokenProvider validates refresh token
        ├─ Extract claims
        └─ Generate NEW access + refresh tokens
        ↓
Return new tokens to frontend
        ↓
Frontend stores new tokens
        ↓
Retry original request with new access token ✓
```

---

## Database Entity Relationships

```
┌────────────────────────────────────────────┐
│              USERS Table                    │
├────────────────────────────────────────────┤
│ id (UUID, PRIMARY KEY)                     │
│ fullname (VARCHAR, NOT NULL)               │
│ email (VARCHAR, UNIQUE, NOT NULL)          │
│ sdt (VARCHAR, nullable)                    │
│ password (VARCHAR, NOT NULL, encrypted)    │
│ role (ENUM: 'admin', 'customer')           │
│ is_active (BOOLEAN, default: true)         │
│ last_login_at (DATETIME, nullable)         │
│ created_at (DATETIME, NOT NULL)            │
│ updated_at (DATETIME, nullable)            │
│ deleted_at (DATETIME, nullable) ← Soft Del.│
├────────────────────────────────────────────┤
│ INDEX: idx_email (email)                   │
│ INDEX: idx_role (role)                     │
│ INDEX: idx_created_at (created_at)         │
└────────────────────────────────────────────┘
```

---

## Configuration Files Impact

### application.yml Controls:
```yaml
jwt:
  secret: → HMAC key for signing tokens
  access-token-expiration: → Access token lifetime (15 min)
  refresh-token-expiration: → Refresh token lifetime (7 days)

spring.datasource:
  url: → MySQL connection string
  username: → DB user
  password: → DB password

server.port: → Service port (8081)

spring.jpa.hibernate.ddl-auto: → Schema generation strategy
```

### pom.xml Provides:
- Spring Security 6.x (authentication)
- Spring Data JPA (database operations)
- JWT library (io.jsonwebtoken)
- BCrypt (password hashing)
- Validation library (Jakarta)
- MySQL driver
- Lombok (annotation processing)
- Spring Boot Test (JUnit 5)

---

## Component Interactions Matrix

```
                 │ Service │ Repository │ Controller │ Security │ Entity
─────────────────┼─────────┼────────────┼────────────┼──────────┼────────
AuthService      │         │ ✓ calls    │ ✓ called   │ ✓        │ ✓
UserService      │ ✓ called│ ✓ calls    │ ✓ called   │          │ ✓
UserRepository   │ ✓ called│            │            │          │ ✓
JwtTokenProvider │ ✓ called│            │            │ ✓        │ uses role
JwtFilter        │         │            │ ✓ upstream │ ✓        │
SecurityConfig   │         │            │            │ ✓        │
UserController   │ ✓ calls │            │            │ ✓ checks │ ✓ returns
AdminController  │ ✓ calls │            │            │ ✓ checks │ ✓ returns
```

---

## Error Flow

```
API Request arrives
        ↓
Processing occurs
        ↓
Exception thrown
        ├─ UserAlreadyExistsException
        ├─ UserNotFoundException
        ├─ InvalidCredentialsException
        ├─ MethodArgumentNotValidException
        └─ Generic Exception
        ↓
GlobalExceptionHandler.handleException()
        ├─ Switch on exception type
        ├─ Set HTTP status code
        ├─ Create error response object
        │  {
        │    "success": false,
        │    "message": "Error description",
        │    "errors": {...},  ← For validation errors
        │    "timestamp": 1234567890
        │  }
        └─ Return to client
```

---

## Summary of Data Transformations

```
Raw Input Data          DTO              Entity           DB Record
────────────────────────────────────────────────────────────────────

Signup Request          SignupRequest    User             Database
{email, password,  ───→ (validated)  ──→ (with id,   ──→ encrypted
 fullname, sdt}                         role, hash)      password

Login Request           LoginRequest     User             login check
{email, password}  ───→ (validated)  ──→ (fetched)   ──→ password match

Update Request          UpdateProfileReq User             updated row
{fullname, sdt}    ───→ (validated)  ──→ (merged)    ──→ in database

Response               UserDto          User              API JSON
Database row       ←─── (from entity)←─ (fetched)   ←─── response
```

---

## Timeline: Request to Response

```
T=0ms     Client sends HTTP request with JWT
T=5ms     → CORS filter checks origin
T=10ms    → JwtAuthenticationFilter extracts token
T=15ms    → JwtTokenProvider validates signature
T=20ms    → SecurityContext populated with authorities
T=25ms    → @PreAuthorize checks role
T=30ms    → Controller method invoked
T=35ms    → Service layer executes business logic
T=50ms    → Repository queries database
T=100ms   → Database returns result set
T=110ms   → Entity mapped to DTO
T=115ms   → ApiResponse wrapper created
T=120ms   → JSON serialization
T=125ms   → HTTP 200 OK response sent to client
```

---

## Future Extension Points

```
Current Architecture:
┌─────────────┐
│User Service │ ← Runs independently on port 8081
└─────────────┘

Future Microservices Architecture:
         ┌──────────────────────────────────┐
         │     API Gateway (Port 8080)      │
         │    (Route requests to services)  │
         └──────┬───────────────┬───────────┘
                │               │
        ┌───────▼────┐  ┌──────▼──────┐
        │User Service│  │Product Serv.│
        │  (8081)    │  │   (8082)    │
        └────────────┘  └─────────────┘
                │
         ┌──────▼────────┐
         │Eureka Service │ (Service Discovery)
         │   (8761)      │
         └───────────────┘

Authentication flow can be:
- Centralized in API Gateway
- Distributed to each microservice
- Managed by service mesh (Istio)
```

---

This architecture supports:
✅ Horizontal scaling (add more instances)
✅ Independent deployment
✅ Service-to-service communication
✅ Centralized or distributed authentication
✅ Easy testing and debugging
