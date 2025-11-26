"""Initial migration

Revision ID: 0001
Revises:
Create Date: 2024-11-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Admins table - Updated to match Admin model
    op.create_table('admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_admins_username', 'admins', ['username'])
    op.create_index('idx_admins_email', 'admins', ['email'])

    # Workers
    op.create_table('workers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('worker_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('jwt_hash', sa.Text(), nullable=False),
        sa.Column('registered_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_active', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked', sa.Boolean(), server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('worker_id')
    )

    # Tasks
    op.create_table('tasks',
        sa.Column('task_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('payload', postgresql.JSONB(), nullable=False),
        sa.Column('result', postgresql.JSONB(), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('worker_id', sa.String(), nullable=True),
        sa.Column('email_notify', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True)
    )

    # Phone Reports
    op.create_table('phone_reports',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('phone_number', sa.String(20), nullable=False, index=True),
        sa.Column('report_type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reported_by_email', sa.String(255), nullable=True)
    )

def downgrade() -> None:
    op.drop_table('phone_reports')
    op.drop_table('tasks')
    op.drop_table('workers')
    op.drop_table('admins')