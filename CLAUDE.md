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

## Backend (`finance-backend-api/`)

See `finance-backend-api/CLAUDE.md` for full backend guidance. Key points:

### Commands

```bash
cd finance-backend-api

# Setup
pip install -r requirements.txt
cp .env.example .env          # edit DATABASE_URL and SECRET_KEY

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

**Implemented**: `categories`, `transactions`, `budgets`
**Scaffolded but empty**: `auth`, `users`, `accounts`, `analytics`, `exports`

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

### Architecture

React Native with Expo ~55 and React Navigation (native stack). Root navigator in `App.js`. UI is in Vietnamese.

Screen stack:
- `HomeScreen` — Dashboard: balance, expense/income tabs, date-range selector, sidebar
- `AddTransactionScreen` — Amount input with calculator, category picker, date picker, image upload (receipts)
- `Transaction` — Transaction history list
- `Chart` — Analytics visualization
- `Notification` / `AddNotification` / `EditNotification` — Budget alerts
- `Profile` — User profile

Shared components in `src/components/`: `DateTimeSelector`, `HeaderIconButton`, `SidebarDrawer`.

**Current state**: UI-only scaffolding. No API calls to the backend are implemented yet. Category lists are hardcoded in components.

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
- After editing a file, always perform the step: "Summarize changes → Update .claude/memory/changes.md"
- Memory recording format:
- **Date**: YYYY-MM-DD
- **File**: path/to/file.ts
- **Changes**: concise bullet list
- **Reason**: reason for the change
- Never edit code without updating the corresponding memory.