"""Test script to debug login issue"""
import asyncio
from database import async_session_factory
from models import User
from sqlalchemy import select
import bcrypt

async def test():
    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.email == 'admin@habaristays.com')
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User found: {user.email}")
            print(f"User ID: {user.id}")
            print(f"Role: {user.role}")
            print(f"Password hash: {user.password_hash[:20]}...")
            print(f"Is active: {user.is_active}")
            print(f"Is verified: {user.is_verified}")
            
            # Test password verification
            is_valid = bcrypt.checkpw("admin123".encode('utf-8'), user.password_hash.encode('utf-8'))
            print(f"Password 'admin123' valid: {is_valid}")
        else:
            print("User not found!")

if __name__ == "__main__":
    asyncio.run(test())
