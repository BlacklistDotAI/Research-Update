# Reset Database and Apply Single Migration

This guide shows how to reset the database and apply the unified initial migration.

## Step 1: Drop Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop and recreate database
DROP DATABASE IF EXISTS blacklist;
CREATE DATABASE blacklist;
\q
```

## Step 2: Apply Migration

```bash
# Apply all migrations (now just 0001_init_full)
alembic upgrade head
```

## Step 3: Create First Admin

```bash
# Run CLI tool to create admin user
python scripts/create_admin.py
```

That's it! Single clean migration with all tables.
