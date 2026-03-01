"""
Database Connection Layer for PostgreSQL with Async SQLAlchemy
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path

from models import Base

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# PostgreSQL connection URL
# Format: postgresql+asyncpg://user:password@host:port/database
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql+asyncpg://postgres:postgres@localhost:5432/habari_stays'
)

# If using standard PostgreSQL URL, convert to asyncpg format
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://', 1)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.environ.get('DB_ECHO', 'false').lower() == 'true',  # SQL logging
    pool_pre_ping=True,  # Verify connections are valid
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()


@asynccontextmanager
async def get_session() -> AsyncSession:
    """Get an async database session with context manager"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db_session():
    """
    Dependency for FastAPI endpoint injection.
    Usage: session: AsyncSession = Depends(get_db_session)
    """
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


# Convenience function for standalone operations
async def execute_query(query):
    """Execute a query and return results"""
    async with get_session() as session:
        result = await session.execute(query)
        return result


# Database health check
async def check_db_health():
    """Check database connectivity"""
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False
