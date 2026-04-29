# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal finance management system inspired by YNAB (You Need A Budget), implementing **zero-based budgeting**: every dollar must be assigned to a category/envelope, income increases a "To Be Budgeted" pool, and all budget periods are strictly monthly (`YYYY-MM`). Built as a FastAPI backend + Expo React Native mobile app.

## Repository Structure

```
financial-management/
├── finance-backend-api/   # FastAPI + MySQL backend (Python 3.11)
└── mobile-app/            # Expo React Native mobile app
```

---

## Backend (`finance-backend-api/`)

### Commands

```bash
cd finance-backend-api

# Setup
pip install -r requirements.txt
cp .env.example .env          # edit DATABASE_URL, SECRET_KEY, GROQ_API_KEY

# Run dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run with Docker (MySQL on port 3307 + API on 8000)
docker-compose up --build

# Migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Lint / format
ruff check app/
black app/
isort app/

# Tests
pytest tests/
pytest tests/unit/test_budgets.py
pytest -k "test_create_transaction"
```

API docs: `http://localhost:8000/docs`

### Required `.env` Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy MySQL URL (e.g. `mysql+pymysql://user:pass@localhost:3307/db`) |
| `SECRET_KEY` | JWT signing secret |
| `GROQ_API_KEY` | Groq API key for AI chat assistant (optional — chat endpoints fail without it) |
| `CORS_ORIGINS` | JSON array of allowed origins (default: localhost:3000/5173) |

### Architecture

Module pattern — each domain under `app/modules/{domain}/`:
- `models.py` → `schemas.py` → `service.py` (all logic) → `router.py` (thin layer)

All routes prefixed with `/api/v1`. Core files:
- `app/core/config.py` — Pydantic settings from `.env`
- `app/core/security.py` — JWT helpers (access + refresh tokens)
- `app/core/exceptions.py` — Custom `HTTPException` subclasses (`NotFoundError`, `UnauthorizedError`, etc.)
- `app/db/session.py` — Synchronous SQLAlchemy 2.0 + PyMySQL; `get_db()` dependency
- `app/shared/dependencies.py` — `get_current_user` (JWT → User ORM object)
- `app/shared/enums.py` — `TransactionType`, `CategoryType`, `AccountType`, `ReconcileStatus`

### Implemented Modules

| Module | Prefix | Notes |
|--------|--------|-------|
| `auth` | `/auth` | Login, register, logout, token refresh |
| `users` | `/users` | Profile CRUD, change password |
| `accounts` | `/accounts` | Account CRUD (bank/cash/credit) |
| `categories` | `/categories` | Category CRUD |
| `transactions` | `/transactions` | Income/expense/transfer, splits, reconciliation |
| `budgets` | `/budgets` | YNAB-style budget entries + alerts |
| `analytics` | `/analytics/dashboard`, `/analytics/reports` | Aggregated stats for charts |
| `savings_goals` | `/savings-goals` | Savings goals with deposit/withdraw |
| `recurring` | `/recurring` | Recurring transaction templates |
| `chat` | `/chat` | Groq-powered AI financial assistant + NLP transaction parser |

### Business Rules

- Use `decimal.Decimal` for all monetary values — never `float`
- All money-touching operations must be atomic (single DB transaction)
- Budget operations are per-month (`YYYY-MM`); no automatic rollover
- Critical actions must write to `audit_logs` (JSON before/after snapshots)
- Soft delete via `is_active` — do not hard-delete financial records
- All queries must filter by `user_id` for data isolation

### Transaction Model

Three types (`TransactionType` enum): `income` (credits account, no category required), `expense` (debits account, updates budget activity), `transfer` (between accounts, no budget impact). Expenses support split across multiple categories via `SplitItem`.

Reconciliation workflow: `uncleared` → `cleared` → `reconciled`. Reconciled transactions cannot be modified or deleted.

### Budget Model (YNAB-style)

`BudgetEntry` tracks `budgeted` + `activity` → `available` per category per month. The "To Be Budgeted" pool = total income received − total assigned. `BudgetAlert` is auto-created when spending crosses a threshold percentage.

---

## Mobile App (`mobile-app/`)

### Commands

```bash
cd mobile-app

npm install
npm start          # Expo dev server
npm run android    # Android emulator/device
npm run ios        # iOS simulator
npm run web        # Browser (Expo web)
```

### API Base URL Configuration

`src/api/config.js` resolves the backend URL in this priority order:
1. `EXPO_PUBLIC_API_BASE_URL` env var (explicit override)
2. Expo's detected LAN host (for physical devices on the same network)
3. `http://10.0.2.2:8000` for Android emulator
4. `http://127.0.0.1:8000` fallback

Set `EXPO_PUBLIC_API_BASE_URL` in a `.env` file at `mobile-app/` root for a fixed backend address.

### Architecture

React Native with Expo ~55 and React Navigation (native stack). Root navigator in `App.js`. UI is in Vietnamese.

**State management:**
- `src/context/AuthContext.js` — `useReducer`-based auth state; wraps `login`/`register`/`logout` from `authApi`; persists tokens to `AsyncStorage`; exposes `useAuth()` hook
- `src/context/ChatContext.js` — Chat message history for AI assistant; exposes `useChatContext()` hook

**API layer** (`src/api/`): One file per domain. All authenticated calls use a shared `getAuthHeaders()` helper that reads the Bearer token from `AsyncStorage`. Files: `authApi.js`, `transactionsApi.js`, `categoriesApi.js`, `accountsApi.js`, `analyticsApi.js`, `savingsGoalsApi.js`, `recurringApi.js`, `chatApi.js`.

**Screens** (`src/screens/`):

| Screen | Purpose |
|--------|---------|
| `LoginScreen` / `SignupScreen` | Auth gate (shown when `userToken` is null) |
| `HomeScreen` | Dashboard: account balance, recent transactions, sidebar nav |
| `AddTransactionScreen` | Amount input with calculator, category picker, date picker |
| `Transaction` | Transaction history list with filters |
| `Chart` | Analytics visualization |
| `CategoriesScreen` | Category management |
| `Notification` / `AddNotification` / `EditNotification` | Budget alerts |
| `SavingsGoalsScreen` / `AddSavingsGoalScreen` | Savings goal tracking |
| `RecurringScreen` / `AddRecurringScreen` | Recurring transaction templates |
| `ChatScreen` | AI financial assistant (Groq) |
| `Profile` / `ChangePasswordScreen` | User profile |

Shared components: `DateTimeSelector`, `HeaderIconButton`, `SidebarDrawer`, `Header`, `Footer`, `TransactionConfirmCard`, `SavingsConfirmCard`.

---

## Team Responsibilities

| Member | Area |
|--------|------|
| Toản | Auth module, user management, JWT, project setup |
| Việt | Transactions, categories, business logic |
| Triết | Analytics, reports, dashboard statistics |
| Masao | UX/UI design (mobile/web) |

## Change Tracking & Memory Rules

- All important code edits must be recorded in memory.
- After editing a file, always perform the step: "Summarize changes → Update `.claude/memory/changes.md`"
- Memory recording format:
  - **Date**: YYYY-MM-DD
  - **File**: path/to/file
  - **Changes**: concise bullet list
  - **Reason**: reason for the change
- Never edit code without updating the corresponding memory.
