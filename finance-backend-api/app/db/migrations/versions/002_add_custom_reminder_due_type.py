"""add custom_reminder_due notification type

Revision ID: 002
Revises:
Create Date: 2026-05-08
"""
from alembic import op

revision = '002'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE notifications
        MODIFY COLUMN type ENUM(
            'recurring_due',
            'recent_transaction',
            'savings_no_deposit',
            'savings_deadline',
            'custom_reminder_due'
        ) NOT NULL
    """)


def downgrade():
    op.execute("DELETE FROM notifications WHERE type = 'custom_reminder_due'")
    op.execute("""
        ALTER TABLE notifications
        MODIFY COLUMN type ENUM(
            'recurring_due',
            'recent_transaction',
            'savings_no_deposit',
            'savings_deadline'
        ) NOT NULL
    """)
