"""
Database Connection Layer for PostgreSQL with Async SQLAlchemy
"""

import os
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
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

# Parse URL to handle SSL parameters for asyncpg
parsed = urlparse(DATABASE_URL)
query_params = parse_qs(parsed.query)

# Check if SSL is required (from sslmode parameter)
ssl_required = query_params.pop('sslmode', [''])[0] in ('require', 'verify-ca', 'verify-full')
# Remove channel_binding as asyncpg doesn't support it
query_params.pop('channel_binding', None)

# Rebuild URL without problematic parameters
clean_query = urlencode({k: v[0] for k, v in query_params.items()}, doseq=False)
clean_url = urlunparse((
    parsed.scheme,
    parsed.netloc,
    parsed.path,
    parsed.params,
    clean_query,
    parsed.fragment
))

# Prepare connect args for SSL
connect_args = {}
if ssl_required or 'neon.tech' in DATABASE_URL:
    # Create SSL context for secure connection
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args['ssl'] = ssl_context

# Create async engine.
# Connection pool: SQLAlchemy's async engine (on top of the asyncpg driver) IS
# the connection pool here - there is no separate raw asyncpg.Pool in this
# codebase. pool_size is the number of connections kept open per Cloud Run
# instance ("min"); max_overflow lets it burst above that under load, capped
# so pool_size + max_overflow never exceeds 10 ("max") per instance.
engine = create_async_engine(
    clean_url,
    echo=os.environ.get('DB_ECHO', 'false').lower() == 'true',  # SQL logging
    pool_pre_ping=True,  # Verify connections are valid before use
    pool_size=2,
    max_overflow=8,
    pool_recycle=300,  # recycle connections every 5 min - avoids stale/dropped
                        # connections to a remote/serverless Postgres (e.g. Neon)
    connect_args=connect_args,
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
