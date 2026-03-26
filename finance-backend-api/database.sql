-- ============================================================
-- Finance Management Database Schema
-- YNAB-style Zero-Based Budgeting System
-- MySQL 8.0+  |  ENGINE=InnoDB  |  utf8mb4
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Drop tables in reverse dependency order ────────────────
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS budget_alerts;
DROP TABLE IF EXISTS budget_entries;
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS split_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS category_groups;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id              INT             NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)    NOT NULL,
    hashed_password VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(150)    NOT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    token       VARCHAR(512)    NOT NULL,
    expires_at  DATETIME        NOT NULL,
    is_revoked  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_token (token),
    KEY idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. ACCOUNTS
-- Bank accounts, wallets, cash — all tracked balances
-- ============================================================
CREATE TABLE accounts (
    id              INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    type            ENUM('cash','bank','e_wallet') NOT NULL,
    current_balance DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    note            TEXT            NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_accounts_user_id (user_id),
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. CATEGORY GROUPS
-- UI grouping for envelopes: "Monthly Bills", "True Expenses"…
-- ============================================================
CREATE TABLE category_groups (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_system   TINYINT(1)      NOT NULL DEFAULT 0,  -- system groups cannot be deleted
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_category_groups_user_id (user_id),
    CONSTRAINT fk_category_groups_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. CATEGORIES  (envelopes)
-- name and type are IMMUTABLE after creation (YNAB rule).
-- Deletion is soft: set is_active = 0.
-- ============================================================
CREATE TABLE categories (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    group_id    INT             NULL,
    name        VARCHAR(100)    NOT NULL,
    type        ENUM('income','expense') NOT NULL,
    color       VARCHAR(20)     NULL,   -- hex e.g. #FF5733
    icon        VARCHAR(50)     NULL,   -- icon key
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_categories_user_id (user_id),
    KEY idx_categories_group_id (group_id),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_categories_group
        FOREIGN KEY (group_id) REFERENCES category_groups (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. SUBCATEGORIES
-- ============================================================
CREATE TABLE subcategories (
    id          INT             NOT NULL AUTO_INCREMENT,
    category_id INT             NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_subcategories_category_id (category_id),
    CONSTRAINT fk_subcategories_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TAGS
-- ============================================================
CREATE TABLE tags (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_tags_user_id (user_id),
    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TRANSACTIONS
-- Every financial movement.
-- reconcile_status: uncleared → cleared → reconciled (immutable after reconciled).
-- is_split: parent row for split transactions (no category_id on parent).
-- ============================================================
CREATE TABLE transactions (
    id                  INT             NOT NULL AUTO_INCREMENT,
    user_id             INT             NOT NULL,
    account_id          INT             NOT NULL,
    target_account_id   INT             NULL,           -- transfers only
    category_id         INT             NULL,           -- NULL for transfers & split parents
    subcategory_id      INT             NULL,
    type                ENUM('income','expense','transfer') NOT NULL,
    amount              DECIMAL(15,2)   NOT NULL,       -- always positive
    note                TEXT            NULL,
    transaction_date    DATETIME        NOT NULL,
    reconcile_status    ENUM('uncleared','cleared','reconciled') NOT NULL DEFAULT 'uncleared',
    is_split            TINYINT(1)      NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_transactions_user_id (user_id),
    KEY idx_transactions_account_id (account_id),
    KEY idx_transactions_category_id (category_id),
    KEY idx_transactions_date (transaction_date),
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_target_account
        FOREIGN KEY (target_account_id) REFERENCES accounts (id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. SPLIT ITEMS
-- One row per category leg of a split transaction.
-- ============================================================
CREATE TABLE split_items (
    id              INT             NOT NULL AUTO_INCREMENT,
    transaction_id  INT             NOT NULL,
    category_id     INT             NULL,
    amount          DECIMAL(15,2)   NOT NULL,
    note            TEXT            NULL,

    PRIMARY KEY (id),
    KEY idx_split_items_transaction_id (transaction_id),
    CONSTRAINT fk_split_items_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    CONSTRAINT fk_split_items_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TRANSACTION TAGS  (many-to-many)
-- ============================================================
CREATE TABLE transaction_tags (
    transaction_id  INT NOT NULL,
    tag_id          INT NOT NULL,

    PRIMARY KEY (transaction_id, tag_id),
    CONSTRAINT fk_transaction_tags_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. BUDGET ENTRIES  (YNAB envelope ledger)
-- One row per (user, category, YYYY-MM).
-- available = budgeted + activity  — always kept in sync by the service layer.
-- activity is negative for expenses (outflows), positive for income categorised here.
-- Overspending (available < 0) is allowed; service layer warns the caller.
-- ============================================================
CREATE TABLE budget_entries (
    id              INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    category_id     INT             NOT NULL,
    period_month    CHAR(7)         NOT NULL,           -- YYYY-MM
    budgeted        DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    activity        DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    available       DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_budget_entry (user_id, category_id, period_month),
    KEY idx_budget_entries_user_month (user_id, period_month),
    CONSTRAINT fk_budget_entries_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_entries_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. BUDGET ALERTS
-- Auto-created when a category's spending crosses the alert threshold.
-- ============================================================
CREATE TABLE budget_alerts (
    id                  INT             NOT NULL AUTO_INCREMENT,
    entry_id            INT             NOT NULL,
    user_id             INT             NOT NULL,
    triggered_percent   INT             NOT NULL,
    message             TEXT            NULL,
    triggered_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read             TINYINT(1)      NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    KEY idx_budget_alerts_entry_id (entry_id),
    KEY idx_budget_alerts_user_id (user_id),
    CONSTRAINT fk_budget_alerts_entry
        FOREIGN KEY (entry_id) REFERENCES budget_entries (id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_alerts_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. AUDIT LOGS
-- Immutable trail of every financial operation.
-- before_data / after_data are JSON strings.
-- ============================================================
CREATE TABLE audit_logs (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    action      ENUM(
                    'assign_budget',
                    'move_money',
                    'create_transaction',
                    'update_transaction',
                    'delete_transaction'
                ) NOT NULL,
    entity_type VARCHAR(50)     NOT NULL,   -- 'budget_entry' | 'transaction'
    entity_id   INT             NOT NULL,
    before_data TEXT            NULL,       -- JSON snapshot before change
    after_data  TEXT            NULL,       -- JSON snapshot after change
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_audit_logs_user_id (user_id),
    KEY idx_audit_logs_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SEED DATA — default category groups & categories per new user
-- ============================================================
-- These INSERT statements are for reference / seeding a single test user.
-- In production the service layer seeds them on first signup.

-- Example: seed for user_id = 1
/*
INSERT INTO category_groups (user_id, name, sort_order, is_system) VALUES
  (1, 'Monthly Bills',      1, 1),
  (1, 'Frequent Spending',  2, 1),
  (1, 'True Expenses',      3, 1),
  (1, 'Debt Payments',      4, 1),
  (1, 'Savings & Goals',    5, 1),
  (1, 'Quality of Life',    6, 1);

-- Monthly Bills
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 1, 'Rent / Mortgage', 'expense'),
  (1, 1, 'Electricity',     'expense'),
  (1, 1, 'Internet',        'expense'),
  (1, 1, 'Phone',           'expense'),
  (1, 1, 'Water',           'expense');

-- Frequent Spending
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 2, 'Groceries',       'expense'),
  (1, 2, 'Dining Out',      'expense'),
  (1, 2, 'Fuel',            'expense'),
  (1, 2, 'Transportation',  'expense');

-- True Expenses
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 3, 'Insurance',           'expense'),
  (1, 3, 'Vehicle Maintenance', 'expense'),
  (1, 3, 'Medical',             'expense'),
  (1, 3, 'Gifts',               'expense'),
  (1, 3, 'Travel',              'expense');

-- Debt Payments
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 4, 'Credit Card',         'expense'),
  (1, 4, 'Loan Installment',    'expense');

-- Savings & Goals
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 5, 'Emergency Fund',      'expense'),
  (1, 5, 'House Down Payment',  'expense'),
  (1, 5, 'Long-term Savings',   'expense');

-- Quality of Life
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, 6, 'Entertainment',       'expense'),
  (1, 6, 'Shopping',            'expense'),
  (1, 6, 'Education',           'expense'),
  (1, 6, 'Hobbies',             'expense');

-- Income category
INSERT INTO categories (user_id, group_id, name, type) VALUES
  (1, NULL, 'Salary',           'income'),
  (1, NULL, 'Freelance',        'income'),
  (1, NULL, 'Other Income',     'income');
*/
