"""
CRUD Operations Layer for Habari Stays
Provides async database operations using SQLAlchemy ORM
"""

from sqlalchemy import select, update, delete, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from models import (
    User, UserSession, Hotel, RoomType, Booking, Review,
    CashierAssignment, CashierActivityLog, ImportBatch
)


def generate_uuid() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ===================== USER OPERATIONS =====================

async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional[User]:
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, user_data: dict) -> User:
    user = User(**user_data)
    session.add(user)
    await session.flush()
    return user


async def update_user(session: AsyncSession, user_id: str, update_data: dict) -> Optional[User]:
    await session.execute(
        update(User).where(User.id == user_id).values(**update_data)
    )
    await session.flush()
    return await get_user_by_id(session, user_id)


async def get_users_by_role(session: AsyncSession, role: str, hotel_ids: List[str] = None) -> List[User]:
    query = select(User).where(User.role == role)
    if hotel_ids:
        query = query.where(User.assigned_hotel_id.in_(hotel_ids))
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_pending_owners(session: AsyncSession) -> List[User]:
    result = await session.execute(
        select(User).where(
            and_(User.role == "owner", User.is_verified == False)
        )
    )
    return list(result.scalars().all())


async def count_users_by_role(session: AsyncSession, role: str, extra_filters: dict = None) -> int:
    query = select(func.count(User.id)).where(User.role == role)
    if extra_filters:
        for key, value in extra_filters.items():
            query = query.where(getattr(User, key) == value)
    result = await session.execute(query)
    return result.scalar_one()


# ===================== SESSION OPERATIONS =====================

async def get_session_by_token(session: AsyncSession, token: str) -> Optional[UserSession]:
    result = await session.execute(
        select(UserSession).where(UserSession.session_token == token)
    )
    return result.scalar_one_or_none()


async def create_user_session(session: AsyncSession, user_id: str, session_token: str, expires_at: datetime) -> UserSession:
    user_session = UserSession(
        id=generate_uuid(),
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    session.add(user_session)
    await session.flush()
    return user_session


async def delete_user_sessions(session: AsyncSession, user_id: str):
    await session.execute(
        delete(UserSession).where(UserSession.user_id == user_id)
    )


# ===================== HOTEL OPERATIONS =====================

async def get_hotel_by_id(session: AsyncSession, hotel_id: str) -> Optional[Hotel]:
    result = await session.execute(
        select(Hotel).where(Hotel.id == hotel_id)
    )
    return result.scalar_one_or_none()


async def get_hotel_by_name(session: AsyncSession, name: str, exclude_id: str = None) -> Optional[Hotel]:
    query = select(Hotel).where(func.lower(Hotel.name) == func.lower(name))
    if exclude_id:
        query = query.where(Hotel.id != exclude_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_hotel_by_name_and_city(session: AsyncSession, name: str, city: str) -> Optional[Hotel]:
    """Check for duplicate hotel by name and city combination."""
    result = await session.execute(
        select(Hotel).where(
            func.lower(Hotel.name) == func.lower(name),
            func.lower(Hotel.city) == func.lower(city)
        )
    )
    return result.scalar_one_or_none()


async def get_hotel_by_phone(session: AsyncSession, phone: str) -> Optional[Hotel]:
    """Check for duplicate hotel by phone number."""
    if not phone:
        return None
    # Normalize phone for comparison
    normalized = phone.replace("+", "").replace(" ", "").replace("-", "")
    result = await session.execute(
        select(Hotel).where(
            func.replace(func.replace(func.replace(Hotel.phone_number, "+", ""), " ", ""), "-", "") == normalized
        )
    )
    return result.scalar_one_or_none()


async def create_hotel(session: AsyncSession, hotel_data: dict) -> Hotel:
    hotel = Hotel(**hotel_data)
    session.add(hotel)
    await session.flush()
    return hotel


async def update_hotel(session: AsyncSession, hotel_id: str, update_data: dict) -> Optional[Hotel]:
    await session.execute(
        update(Hotel).where(Hotel.id == hotel_id).values(**update_data)
    )
    await session.flush()
    return await get_hotel_by_id(session, hotel_id)


async def delete_hotel(session: AsyncSession, hotel_id: str):
    await session.execute(
        delete(Hotel).where(Hotel.id == hotel_id)
    )


async def get_hotels(
    session: AsyncSession,
    city: str = None,
    status: str = None,
    owner_id: str = None,
    search: str = None,
    limit: int = 100
) -> List[Hotel]:
    query = select(Hotel)
    
    conditions = []
    if city:
        conditions.append(func.lower(Hotel.city) == func.lower(city))
    if status:
        conditions.append(Hotel.status == status)
    if owner_id:
        conditions.append(Hotel.owner_id == owner_id)
    if search:
        conditions.append(
            or_(
                Hotel.name.ilike(f"%{search}%"),
                Hotel.city.ilike(f"%{search}%"),
                Hotel.address.ilike(f"%{search}%")
            )
        )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(desc(Hotel.created_at)).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_hotels_by_owner(session: AsyncSession, owner_id: str) -> List[Hotel]:
    result = await session.execute(
        select(Hotel).where(Hotel.owner_id == owner_id)
    )
    return list(result.scalars().all())


async def count_hotels(session: AsyncSession, status: str = None) -> int:
    query = select(func.count(Hotel.id))
    if status:
        query = query.where(Hotel.status == status)
    result = await session.execute(query)
    return result.scalar_one()


async def get_distinct_cities(session: AsyncSession) -> List[str]:
    result = await session.execute(
        select(Hotel.city).where(Hotel.city != "").distinct()
    )
    return [row[0] for row in result.all()]


# ===================== ROOM TYPE OPERATIONS =====================

async def get_room_type_by_id(session: AsyncSession, room_id: str) -> Optional[RoomType]:
    result = await session.execute(
        select(RoomType).where(RoomType.id == room_id)
    )
    return result.scalar_one_or_none()


async def get_room_types_by_hotel(session: AsyncSession, hotel_id: str) -> List[RoomType]:
    result = await session.execute(
        select(RoomType).where(RoomType.hotel_id == hotel_id).order_by(RoomType.created_at)
    )
    return list(result.scalars().all())


async def create_room_type(session: AsyncSession, room_data: dict) -> RoomType:
    room = RoomType(**room_data)
    session.add(room)
    await session.flush()
    return room


async def update_room_type(session: AsyncSession, room_id: str, update_data: dict) -> Optional[RoomType]:
    await session.execute(
        update(RoomType).where(RoomType.id == room_id).values(**update_data)
    )
    await session.flush()
    return await get_room_type_by_id(session, room_id)


async def delete_room_type(session: AsyncSession, room_id: str):
    await session.execute(
        delete(RoomType).where(RoomType.id == room_id)
    )


async def delete_room_types_by_hotel(session: AsyncSession, hotel_id: str):
    await session.execute(
        delete(RoomType).where(RoomType.hotel_id == hotel_id)
    )


async def increment_room_availability(session: AsyncSession, room_id: str, delta: int = 1):
    await session.execute(
        update(RoomType)
        .where(RoomType.id == room_id)
        .values(available_rooms=RoomType.available_rooms + delta)
    )


async def get_room_types_with_availability(
    session: AsyncSession, hotel_ids: List[str] = None
) -> List[RoomType]:
    query = select(RoomType)
    if hotel_ids:
        query = query.where(RoomType.hotel_id.in_(hotel_ids))
    result = await session.execute(query)
    return list(result.scalars().all())


# ===================== BOOKING OPERATIONS =====================

async def get_booking_by_id(session: AsyncSession, booking_id: str) -> Optional[Booking]:
    result = await session.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    return result.scalar_one_or_none()


async def get_booking_by_ref(session: AsyncSession, booking_ref: str) -> Optional[Booking]:
    result = await session.execute(
        select(Booking).where(Booking.booking_ref == booking_ref)
    )
    return result.scalar_one_or_none()


async def create_booking(session: AsyncSession, booking_data: dict) -> Booking:
    booking = Booking(**booking_data)
    session.add(booking)
    await session.flush()
    return booking


async def update_booking(session: AsyncSession, booking_id: str, update_data: dict) -> Optional[Booking]:
    await session.execute(
        update(Booking).where(Booking.id == booking_id).values(**update_data)
    )
    await session.flush()
    return await get_booking_by_id(session, booking_id)


async def get_bookings(
    session: AsyncSession,
    hotel_id: str = None,
    hotel_ids: List[str] = None,
    status: str = None,
    checkin_date: str = None,
    booking_type: str = None,
    checkin_status: str = None,
    guest_phone: str = None,
    guest_name: str = None,
    created_by: str = None,
    created_after: str = None,
    limit: int = 500
) -> List[Booking]:
    query = select(Booking)
    
    conditions = []
    if hotel_id:
        conditions.append(Booking.hotel_id == hotel_id)
    if hotel_ids:
        conditions.append(Booking.hotel_id.in_(hotel_ids))
    if status:
        if isinstance(status, list):
            conditions.append(Booking.status.in_(status))
        else:
            conditions.append(Booking.status == status)
    if checkin_date:
        conditions.append(Booking.checkin_date == checkin_date)
    if booking_type:
        conditions.append(Booking.booking_type == booking_type)
    if checkin_status:
        if isinstance(checkin_status, list):
            conditions.append(Booking.checkin_status.in_(checkin_status))
        else:
            conditions.append(Booking.checkin_status == checkin_status)
    if guest_phone:
        conditions.append(Booking.guest_phone.ilike(f"%{guest_phone}%"))
    if guest_name:
        conditions.append(Booking.guest_name.ilike(f"%{guest_name}%"))
    if created_by:
        conditions.append(Booking.created_by == created_by)
    if created_after:
        conditions.append(Booking.created_at >= created_after)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(desc(Booking.created_at)).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_todays_checkins(session: AsyncSession, hotel_id: str, today: str) -> List[Booking]:
    result = await session.execute(
        select(Booking).where(
            and_(
                Booking.hotel_id == hotel_id,
                Booking.checkin_date == today,
                Booking.booking_type == "online",
                Booking.status.in_(["confirmed", "pending"])
            )
        )
    )
    return list(result.scalars().all())


async def get_active_guests(session: AsyncSession, hotel_id: str) -> List[Booking]:
    result = await session.execute(
        select(Booking).where(
            and_(
                Booking.hotel_id == hotel_id,
                Booking.checkin_status == "checked_in"
            )
        )
    )
    return list(result.scalars().all())


async def get_expired_bookings(session: AsyncSession, current_time: datetime) -> List[Booking]:
    result = await session.execute(
        select(Booking).where(
            and_(
                Booking.status == "pending",
                Booking.payment_status == "unpaid",
                Booking.expires_at < current_time
            )
        ).limit(100)
    )
    return list(result.scalars().all())


async def count_bookings(
    session: AsyncSession,
    hotel_id: str = None,
    hotel_ids: List[str] = None,
    status: str = None,
    payment_status: str = None,
    booking_type: str = None,
    checkin_status: str = None,
    created_after: str = None
) -> int:
    query = select(func.count(Booking.id))
    
    conditions = []
    if hotel_id:
        conditions.append(Booking.hotel_id == hotel_id)
    if hotel_ids:
        conditions.append(Booking.hotel_id.in_(hotel_ids))
    if status:
        if isinstance(status, list):
            conditions.append(Booking.status.in_(status))
        else:
            conditions.append(Booking.status == status)
    if payment_status:
        conditions.append(Booking.payment_status == payment_status)
    if booking_type:
        conditions.append(Booking.booking_type == booking_type)
    if checkin_status:
        if isinstance(checkin_status, list):
            conditions.append(Booking.checkin_status.in_(checkin_status))
        else:
            conditions.append(Booking.checkin_status == checkin_status)
    if created_after:
        conditions.append(Booking.created_at >= created_after)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    result = await session.execute(query)
    return result.scalar_one()


async def get_revenue_sum(
    session: AsyncSession,
    hotel_id: str = None,
    hotel_ids: List[str] = None,
    created_after: str = None
) -> int:
    query = select(func.coalesce(func.sum(Booking.total_amount_tzs), 0)).where(
        Booking.payment_status == "paid"
    )
    
    if hotel_id:
        query = query.where(Booking.hotel_id == hotel_id)
    if hotel_ids:
        query = query.where(Booking.hotel_id.in_(hotel_ids))
    if created_after:
        query = query.where(Booking.created_at >= created_after)
    
    result = await session.execute(query)
    return result.scalar_one()


async def search_bookings(
    session: AsyncSession,
    search_term: str,
    hotel_id: str = None
) -> Optional[Booking]:
    # Try by booking ref
    if search_term.upper().startswith("HS-"):
        booking = await get_booking_by_ref(session, search_term.upper())
        if booking:
            return booking
    
    # Try by phone
    result = await session.execute(
        select(Booking).where(
            Booking.guest_phone.ilike(f"%{search_term}%")
        ).order_by(desc(Booking.created_at)).limit(1)
    )
    booking = result.scalar_one_or_none()
    if booking:
        return booking
    
    # Try by name
    result = await session.execute(
        select(Booking).where(
            Booking.guest_name.ilike(f"%{search_term}%")
        ).order_by(desc(Booking.created_at)).limit(1)
    )
    return result.scalar_one_or_none()


# ===================== REVIEW OPERATIONS =====================

async def get_review_by_booking(session: AsyncSession, booking_id: str) -> Optional[Review]:
    result = await session.execute(
        select(Review).where(Review.booking_id == booking_id)
    )
    return result.scalar_one_or_none()


async def create_review(session: AsyncSession, review_data: dict) -> Review:
    review = Review(**review_data)
    session.add(review)
    await session.flush()
    return review


async def get_reviews_by_hotel(session: AsyncSession, hotel_id: str) -> List[Review]:
    result = await session.execute(
        select(Review).where(Review.hotel_id == hotel_id).order_by(desc(Review.created_at))
    )
    return list(result.scalars().all())


# ===================== CASHIER ASSIGNMENT OPERATIONS =====================

async def create_cashier_assignment(session: AsyncSession, assignment_data: dict) -> CashierAssignment:
    assignment = CashierAssignment(**assignment_data)
    session.add(assignment)
    await session.flush()
    return assignment


async def update_cashier_assignments(
    session: AsyncSession,
    cashier_id: str,
    is_active: bool = None,
    deactivate_all: bool = False
):
    if deactivate_all:
        await session.execute(
            update(CashierAssignment)
            .where(and_(CashierAssignment.cashier_id == cashier_id, CashierAssignment.is_active == True))
            .values(is_active=False)
        )
    elif is_active is not None:
        await session.execute(
            update(CashierAssignment)
            .where(and_(CashierAssignment.cashier_id == cashier_id, CashierAssignment.is_active == True))
            .values(is_active=is_active)
        )


# ===================== CASHIER ACTIVITY LOG OPERATIONS =====================

async def create_activity_log(session: AsyncSession, log_data: dict) -> CashierActivityLog:
    log = CashierActivityLog(**log_data)
    session.add(log)
    await session.flush()
    return log


async def get_activity_logs(
    session: AsyncSession,
    cashier_id: str = None,
    hotel_id: str = None,
    after_timestamp: datetime = None,
    limit: int = 200
) -> List[CashierActivityLog]:
    query = select(CashierActivityLog)
    
    conditions = []
    if cashier_id:
        conditions.append(CashierActivityLog.cashier_id == cashier_id)
    if hotel_id:
        conditions.append(CashierActivityLog.hotel_id == hotel_id)
    if after_timestamp:
        conditions.append(CashierActivityLog.timestamp >= after_timestamp)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(desc(CashierActivityLog.timestamp)).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


# ===================== IMPORT BATCH OPERATIONS =====================

async def create_import_batch(session: AsyncSession, batch_data: dict) -> ImportBatch:
    batch = ImportBatch(**batch_data)
    session.add(batch)
    await session.flush()
    return batch


async def get_import_batch_by_id(session: AsyncSession, batch_id: str) -> Optional[ImportBatch]:
    result = await session.execute(
        select(ImportBatch).where(ImportBatch.id == batch_id)
    )
    return result.scalar_one_or_none()


async def get_import_batches(session: AsyncSession, limit: int = 50) -> List[ImportBatch]:
    result = await session.execute(
        select(ImportBatch).order_by(desc(ImportBatch.created_at)).limit(limit)
    )
    return list(result.scalars().all())


async def get_hotels_by_batch(session: AsyncSession, batch_id: str) -> List[Hotel]:
    result = await session.execute(
        select(Hotel).where(Hotel.import_batch_id == batch_id)
    )
    return list(result.scalars().all())


# ===================== AGGREGATE/ANALYTICS OPERATIONS =====================

async def get_revenue_by_city(session: AsyncSession) -> List[Dict]:
    """Get revenue breakdown by city - using raw SQL for complex aggregation"""
    from sqlalchemy import text
    
    query = text("""
        SELECT h.city, 
               COALESCE(SUM(b.total_amount_tzs), 0) as revenue,
               COUNT(b.id) as count
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        WHERE b.payment_status = 'paid'
        GROUP BY h.city
        ORDER BY revenue DESC
        LIMIT 10
    """)
    
    result = await session.execute(query)
    return [{"city": row[0], "revenue": row[1], "bookings": row[2]} for row in result.all()]


async def get_daily_revenue_breakdown(
    session: AsyncSession,
    hotel_ids: List[str] = None,
    start_date: str = None
) -> Dict[str, Dict]:
    from sqlalchemy import text
    
    conditions = ["payment_status = 'paid'"]
    params = {}
    
    if hotel_ids:
        conditions.append("hotel_id = ANY(:hotel_ids)")
        params["hotel_ids"] = hotel_ids
    if start_date:
        conditions.append("created_at >= :start_date")
        params["start_date"] = start_date
    
    where_clause = " AND ".join(conditions)
    
    query = text(f"""
        SELECT 
            DATE(created_at) as date,
            booking_type,
            SUM(total_amount_tzs) as total
        FROM bookings
        WHERE {where_clause}
        GROUP BY DATE(created_at), booking_type
        ORDER BY date
    """)
    
    result = await session.execute(query, params)
    
    daily = {}
    for row in result.all():
        date_str = str(row[0])
        if date_str not in daily:
            daily[date_str] = {"date": date_str, "online": 0, "walkin": 0, "total": 0}
        
        amount = row[2] or 0
        daily[date_str][row[1]] = amount
        daily[date_str]["total"] += amount
    
    return daily
