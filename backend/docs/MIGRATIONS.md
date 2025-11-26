# Database Migrations Guide

This guide covers all database migration tasks using Alembic.

---

## Table of Contents

1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Running Migrations](#running-migrations)
4. [Creating New Migrations](#creating-new-migrations)
5. [Migration Commands](#migration-commands)
6. [Troubleshooting](#troubleshooting)
7. [Production Migrations](#production-migrations)

---

## Overview

This project uses **Alembic** for database schema migrations with PostgreSQL.

### Migration Files Location

```
migrations/
├── versions/
│   └── 0001_init_full.py    # Initial schema
├── env.py                    # Alembic environment
└── alembic.ini              # Alembic configuration (in root)
```

### Database Schema

The system uses 4 main tables:

1. **admins** - Admin user accounts
2. **workers** - Registered worker nodes
3. **tasks** - Task execution records
4. **phone_reports** - Phone number reports

---

## Initial Setup

### 1. Install Dependencies

```bash
pip install alembic psycopg2-binary SQLAlchemy
```

### 2. Configure Database Connection

Edit your `.env` file:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpgpass
POSTGRES_DB=blacklist
```

### 3. Verify Configuration

Check the database URL in `alembic.ini`:

```ini
sqlalchemy.url = postgresql://postgres:yourpgpass@localhost:5432/blacklist
```

> **Note**: In production, the URL is automatically loaded from environment variables via `migrations/env.py`

---

## Running Migrations

### First Time Setup

Run all migrations to create the initial schema:

```bash
# From project root
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> 0001, Initial migration
```

### Verify Migration Status

```bash
alembic current
```

**Output:**
```
0001 (head)
```

### View Migration History

```bash
alembic history
```

**Output:**
```
0001 -> head (head), Initial migration
  Initial schema with admins, workers, tasks, phone_reports
```

---

## Creating New Migrations

### Auto-Generate Migration from Model Changes

1. **Modify your SQLAlchemy models** in `app/models/`:

```python
# app/models/phone_report.py
class PhoneReport(Base):
    __tablename__ = "phone_reports"

    # Add new column
    risk_score = Column(Integer, default=0)  # NEW
```

2. **Generate migration automatically:**

```bash
alembic revision --autogenerate -m "Add risk_score to phone_reports"
```

**Output:**
```
INFO  [alembic.autogenerate.compare] Detected added column 'phone_reports.risk_score'
  Generating migrations/versions/0002_add_risk_score.py ... done
```

3. **Review the generated migration:**

```bash
cat migrations/versions/0002_add_risk_score.py
```

4. **Apply the migration:**

```bash
alembic upgrade head
```

### Manual Migration Creation

For complex changes that can't be auto-generated:

```bash
alembic revision -m "Add custom index"
```

Edit the generated file:

```python
"""Add custom index

Revision ID: 0003
Revises: 0002
"""

def upgrade() -> None:
    op.create_index(
        'idx_phone_reports_status_created',
        'phone_reports',
        ['status', 'created_at']
    )

def downgrade() -> None:
    op.drop_index('idx_phone_reports_status_created', table_name='phone_reports')
```

---

## Migration Commands

### Common Commands

| Command | Description |
|---------|-------------|
| `alembic upgrade head` | Apply all pending migrations |
| `alembic upgrade +1` | Apply next migration only |
| `alembic downgrade -1` | Rollback last migration |
| `alembic downgrade base` | Rollback all migrations |
| `alembic current` | Show current revision |
| `alembic history` | Show migration history |
| `alembic show <revision>` | Show specific migration details |
| `alembic stamp head` | Mark DB as current without running migrations |

### Upgrade to Specific Revision

```bash
alembic upgrade 0002
```

### Downgrade to Specific Revision

```bash
alembic downgrade 0001
```

### Check for Pending Migrations

```bash
alembic current
alembic heads
```

If they differ, you have pending migrations.

---

## Troubleshooting

### Error: "Can't locate revision identified by 'xxxx'"

**Solution:** The database is out of sync with migration files.

```bash
# Reset to base and re-apply
alembic downgrade base
alembic upgrade head
```

### Error: "Table already exists"

**Solution:** Database has tables but Alembic doesn't know about them.

```bash
# Mark database as migrated without running migrations
alembic stamp head
```

### Error: "Target database is not up to date"

**Solution:** Apply pending migrations.

```bash
alembic upgrade head
```

### Error: "Multiple head revisions present"

**Solution:** Merge migration branches.

```bash
alembic merge heads -m "Merge migrations"
alembic upgrade head
```

### Fresh Start (Development Only)

```bash
# Drop all tables
psql -U postgres -d blacklist -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
alembic upgrade head
```

---

## Production Migrations

### Pre-Migration Checklist

- [ ] **Backup database**
  ```bash
  pg_dump -U postgres blacklist > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test migration on staging**
  ```bash
  alembic upgrade head --sql > migration.sql  # Review SQL
  ```

- [ ] **Review generated SQL**
  ```bash
  cat migration.sql
  ```

- [ ] **Check migration is reversible**
  ```bash
  alembic downgrade -1 --sql > rollback.sql
  ```

### Safe Production Migration Process

1. **Enable maintenance mode** (if applicable)

2. **Backup database:**
   ```bash
   pg_dump -U postgres -h prod-db.example.com blacklist > backup.sql
   ```

3. **Run migration with output logging:**
   ```bash
   alembic upgrade head 2>&1 | tee migration.log
   ```

4. **Verify migration:**
   ```bash
   alembic current
   psql -U postgres -d blacklist -c "\dt"  # List tables
   psql -U postgres -d blacklist -c "\d phone_reports"  # Check schema
   ```

5. **Test application:**
   ```bash
   curl http://localhost:8000/health
   ```

6. **Disable maintenance mode**

### Zero-Downtime Migrations

For migrations that might take time:

**Step 1: Add column (nullable)**
```python
def upgrade():
    op.add_column('phone_reports', sa.Column('risk_score', sa.Integer(), nullable=True))
```

**Step 2: Deploy code that writes to both old and new columns**

**Step 3: Backfill data**
```sql
UPDATE phone_reports SET risk_score = 50 WHERE risk_score IS NULL;
```

**Step 4: Make column NOT NULL**
```python
def upgrade():
    op.alter_column('phone_reports', 'risk_score', nullable=False)
```

### Rollback Plan

If migration fails:

```bash
# Rollback migration
alembic downgrade -1

# Restore from backup (if needed)
psql -U postgres blacklist < backup.sql

# Restart application
systemctl restart blacklist-server
```

---

## Migration Best Practices

### DO's ✅

- **Always review auto-generated migrations** before applying
- **Test migrations on staging first**
- **Create backup before production migrations**
- **Use transactions** (Alembic does this by default)
- **Keep migrations small and focused**
- **Add comments** explaining complex migrations
- **Test rollback** before production deployment

### DON'Ts ❌

- **Don't modify existing migration files** after they've been applied
- **Don't skip migrations** (always use `upgrade head`)
- **Don't run migrations manually in production** without testing
- **Don't delete migration files** that have been applied
- **Don't run migrations without backups**

---

## Database Schema Reference

### Current Schema (Revision 0001)

#### admins
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### workers
```sql
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    worker_id UUID UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    jwt_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE
);
```

#### tasks
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_id UUID UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL,
    payload JSONB,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    worker_id UUID,
    error_message TEXT
);
```

#### phone_reports
```sql
CREATE TABLE phone_reports (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    report_type VARCHAR(20) NOT NULL,
    reported_by_email VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_phone_reports_phone ON phone_reports(phone_number);
CREATE INDEX idx_phone_reports_status ON phone_reports(status);
```

---

## Advanced Topics

### Custom Migration Scripts

For data migrations or complex operations:

```python
"""Complex data migration

Revision ID: 0004
"""

def upgrade():
    # Use raw SQL for complex operations
    op.execute("""
        UPDATE phone_reports
        SET risk_score = CASE
            WHEN report_type = 'SCAM' THEN 90
            WHEN report_type = 'SPAM' THEN 50
            ELSE 10
        END
        WHERE risk_score IS NULL
    """)

def downgrade():
    op.execute("UPDATE phone_reports SET risk_score = NULL")
```

### Branching and Merging

When multiple developers create migrations:

```bash
# Show all heads
alembic heads

# Merge branches
alembic merge heads -m "Merge dev branches"

# Apply merged migration
alembic upgrade head
```

### Testing Migrations

```python
# tests/test_migrations.py
def test_upgrade_downgrade():
    alembic.command.upgrade(config, "head")
    alembic.command.downgrade(config, "base")
    alembic.command.upgrade(config, "head")
```

---

## Quick Reference

### New Project Setup
```bash
alembic upgrade head
```

### After Model Changes
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Production Migration
```bash
pg_dump blacklist > backup.sql
alembic upgrade head
```

### Rollback Last Migration
```bash
alembic downgrade -1
```

---

## Support

For migration issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Alembic docs: https://alembic.sqlalchemy.org
3. Check database logs: `tail -f /var/log/postgresql/postgresql.log`
4. Verify connection: `psql -U postgres -d blacklist -c "\dt"`

---

**Last Updated:** 2024-11-19
