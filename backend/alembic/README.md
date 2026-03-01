# Alembic Migrations for Habari Stays

This directory contains database migration scripts for the PostgreSQL database.

## Setup

1. Install dependencies:
   ```bash
   pip install alembic psycopg2-binary asyncpg sqlalchemy[asyncio]
   ```

2. Set the database URL environment variable:
   ```bash
   # Windows
   set DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/habari_stays
   
   # Linux/Mac
   export DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/habari_stays
   ```

## Commands

### Run all pending migrations
```bash
alembic upgrade head
```

### Rollback last migration
```bash
alembic downgrade -1
```

### Rollback all migrations
```bash
alembic downgrade base
```

### View current migration status
```bash
alembic current
```

### View migration history
```bash
alembic history
```

### Create a new migration (autogenerate from model changes)
```bash
alembic revision --autogenerate -m "description of changes"
```

### Create an empty migration
```bash
alembic revision -m "description of changes"
```

## Structure

- `env.py` - Alembic environment configuration (async SQLAlchemy support)
- `script.py.mako` - Template for new migration files
- `versions/` - Migration scripts directory
  - `001_initial_migration.py` - Initial schema creation

## Notes

- The database URL can be set in `alembic.ini` or via the `DATABASE_URL` environment variable
- Environment variable takes precedence over `alembic.ini`
- All migrations support both upgrade and downgrade operations
