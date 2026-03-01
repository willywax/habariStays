"""
Database Seed Script for Habari Stays

Creates initial admin and owner users for the platform.
Run this script after the database migrations have been applied.

Usage:
    python seed.py
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from models import Base, User

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/habari_stays")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def seed_database():
    """Seed the database with initial users"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Define seed users
        seed_users = [
            {
                "email": "admin@habaristays.com",
                "password": "admin123",
                "full_name": "System Admin",
                "role": "admin",
                "phone": "+255700000001",
            },
            {
                "email": "owner@habaristays.com",
                "password": "owner123",
                "full_name": "Hotel Owner",
                "role": "owner",
                "phone": "+255700000002",
            },
        ]
        
        for user_data in seed_users:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create new user
            new_user = User(
                id=str(uuid.uuid4()),
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                phone=user_data.get("phone"),
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            
            session.add(new_user)
            print(f"Created user: {user_data['email']} (role: {user_data['role']})")
        
        await session.commit()
        print("\nDatabase seeding completed!")
        print("\n=== Login Credentials ===")
        print("Admin: admin@habaristays.com / admin123")
        print("Owner: owner@habaristays.com / owner123")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
