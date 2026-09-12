"""
SQLAlchemy ORM Models for Habari Stays
PostgreSQL Database Schema
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey,
    JSON, Index, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import uuid
import enum

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    TRAVELER = "traveler"
    OWNER = "owner"
    ADMIN = "admin"
    CASHIER = "cashier"
    BACKOFFICE = "backoffice"


class AnalyticsEventType(str, enum.Enum):
    HOTEL_SEARCH = "hotel_search"
    HOTEL_VIEW = "hotel_view"
    WHATSAPP_CLICK = "whatsapp_click"
    PHONE_REVEALED = "phone_revealed"
    ZERO_RESULTS = "zero_results"
    REPORT_SUBMITTED = "report_submitted"


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(SQLEnum(
        AnalyticsEventType, name="analytics_event_type",
        values_callable=lambda values: [item.value for item in values],
    ), nullable=False, index=True)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="SET NULL"), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    session_id = Column(String(255), nullable=True)
    budget_min = Column(Integer, nullable=True)
    budget_max = Column(Integer, nullable=True)
    results_count = Column(Integer, nullable=True)
    # `metadata` is reserved by SQLAlchemy's declarative API.
    event_metadata = Column("metadata", JSONB, nullable=False, default=dict, server_default="{}")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class CallStatus(str, enum.Enum):
    PENDING = "pending"
    CALLED = "called"
    VERIFIED = "verified"
    UNREACHABLE = "unreachable"


class HotelStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    IMPORTED = "imported"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"


class CheckinStatus(str, enum.Enum):
    NOT_CHECKED_IN = "not_checked_in"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"


class BookingType(str, enum.Enum):
    ONLINE = "online"
    WALKIN = "walkin"


class PaymentMethod(str, enum.Enum):
    MPESA = "mpesa"
    CASH = "cash"
    CARD = "card"


class ReportField(str, enum.Enum):
    PRICE = "price"
    PHONE = "phone"
    ADDRESS = "address"
    CLOSED = "closed"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    role = Column(String(20), default="traveler", index=True)
    assigned_hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="SET NULL"), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    picture = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assigned_hotel = relationship("Hotel", foreign_keys=[assigned_hotel_id], back_populates="cashiers")
    owned_hotels = relationship("Hotel", foreign_keys="Hotel.owner_id", back_populates="owner")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    bookings_created = relationship("Booking", foreign_keys="Booking.created_by", back_populates="creator")
    cashier_assignments = relationship("CashierAssignment", foreign_keys="CashierAssignment.cashier_id", back_populates="cashier")
    activity_logs = relationship("CashierActivityLog", back_populates="cashier")

    __table_args__ = (
        Index('ix_users_role_hotel', 'role', 'assigned_hotel_id'),
    )

    def to_dict(self, exclude_password=True):
        data = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "assigned_hotel_id": self.assigned_hotel_id,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "picture": self.picture,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        if not exclude_password:
            data["password_hash"] = self.password_hash
        return data


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="sessions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_token": self.session_token,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_code = Column(String(20), unique=True, nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, default="")
    address = Column(String(500), default="")
    city = Column(String(100), default="", index=True)
    phone_number = Column(String(20), default="")
    whatsapp_number = Column(String(20), nullable=True)
    amenities = Column(JSON, default=list)
    cover_photo = Column(String(500), nullable=True)
    photos = Column(JSON, default=list)
    google_maps_url = Column(String(500), nullable=True)
    google_rating = Column(Float, nullable=True)
    google_review_count = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    website = Column(String(500), nullable=True)
    status = Column(String(20), default="pending", index=True)
    data_source = Column(String(50), default="manual")
    import_batch_id = Column(String(36), ForeignKey("import_batches.id", ondelete="SET NULL"), nullable=True)
    call_status = Column(String(20), default="pending", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_hotels")
    cashiers = relationship("User", foreign_keys="User.assigned_hotel_id", back_populates="assigned_hotel")
    room_types = relationship("RoomType", back_populates="hotel", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="hotel")
    reviews = relationship("Review", back_populates="hotel")
    import_batch = relationship("ImportBatch", back_populates="hotels")

    __table_args__ = (
        Index('ix_hotels_city_status', 'city', 'status'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "hotel_code": self.hotel_code,
            "owner_id": self.owner_id,
            "name": self.name,
            "description": self.description,
            "address": self.address,
            "city": self.city,
            "phone_number": self.phone_number,
            "whatsapp_number": self.whatsapp_number,
            "amenities": self.amenities or [],
            "cover_photo": self.cover_photo,
            "photos": self.photos or [],
            "google_maps_url": self.google_maps_url,
            "google_rating": self.google_rating,
            "google_review_count": self.google_review_count,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "website": self.website,
            "status": self.status,
            "data_source": self.data_source,
            "import_batch_id": self.import_batch_id,
            "call_status": self.call_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    price_per_night = Column(Integer, nullable=False)
    capacity = Column(Integer, default=2)
    total_rooms = Column(Integer, default=1)
    available_rooms = Column(Integer, default=1)
    amenities = Column(JSON, default=list)
    photos = Column(JSON, default=list)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    hotel = relationship("Hotel", back_populates="room_types")
    bookings = relationship("Booking", back_populates="room_type")

    def to_dict(self):
        return {
            "id": self.id,
            "hotel_id": self.hotel_id,
            "name": self.name,
            "description": self.description,
            "price_per_night": self.price_per_night,
            "capacity": self.capacity,
            "total_rooms": self.total_rooms,
            "available_rooms": self.available_rooms,
            "amenities": self.amenities or [],
            "photos": self.photos or [],
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_ref = Column(String(20), unique=True, nullable=False, index=True)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    room_type_id = Column(String(36), ForeignKey("room_types.id", ondelete="SET NULL"), nullable=True)
    guest_name = Column(String(255), nullable=False)
    guest_phone = Column(String(20), nullable=False, index=True)
    guest_email = Column(String(255), nullable=True)
    checkin_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD format
    checkout_date = Column(String(10), nullable=False)
    nights = Column(Integer, default=1)
    num_guests = Column(Integer, default=1)
    total_amount_tzs = Column(Integer, nullable=False)
    booking_type = Column(String(20), default="online", index=True)
    payment_method = Column(String(20), default="mpesa")
    payment_status = Column(String(20), default="unpaid", index=True)
    payment_reference = Column(String(100), nullable=True)
    status = Column(String(20), default="pending", index=True)
    checkin_status = Column(String(20), default="not_checked_in", index=True)
    actual_checkin_time = Column(DateTime(timezone=True), nullable=True)
    actual_checkout_time = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    hotel = relationship("Hotel", back_populates="bookings")
    room_type = relationship("RoomType", back_populates="bookings")
    creator = relationship("User", foreign_keys=[created_by], back_populates="bookings_created")
    review = relationship("Review", back_populates="booking", uselist=False)

    __table_args__ = (
        Index('ix_bookings_hotel_date', 'hotel_id', 'checkin_date'),
        Index('ix_bookings_status_payment', 'status', 'payment_status'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "booking_ref": self.booking_ref,
            "hotel_id": self.hotel_id,
            "room_type_id": self.room_type_id,
            "guest_name": self.guest_name,
            "guest_phone": self.guest_phone,
            "guest_email": self.guest_email,
            "checkin_date": self.checkin_date,
            "checkout_date": self.checkout_date,
            "nights": self.nights,
            "num_guests": self.num_guests,
            "total_amount_tzs": self.total_amount_tzs,
            "booking_type": self.booking_type,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "payment_reference": self.payment_reference,
            "status": self.status,
            "checkin_status": self.checkin_status,
            "actual_checkin_time": self.actual_checkin_time.isoformat() if self.actual_checkin_time else None,
            "actual_checkout_time": self.actual_checkout_time.isoformat() if self.actual_checkout_time else None,
            "created_by": self.created_by,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_name = Column(String(255), nullable=False)
    guest_phone = Column(String(20), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("Booking", back_populates="review")
    hotel = relationship("Hotel", back_populates="reviews")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "hotel_id": self.hotel_id,
            "guest_name": self.guest_name,
            "guest_phone": self.guest_phone,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HotelReport(Base):
    """A visitor-submitted 'this listing looks wrong' report - anonymous,
    no auth required to create. Admins review and resolve these."""
    __tablename__ = "hotel_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_email = Column(String(255), nullable=True)
    field_reported = Column(String(20), nullable=False)
    note = Column(Text, default="")
    resolved = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    hotel = relationship("Hotel")

    def to_dict(self):
        return {
            "id": self.id,
            "hotel_id": self.hotel_id,
            "reporter_email": self.reporter_email,
            "field_reported": self.field_reported,
            "note": self.note,
            "resolved": self.resolved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HotelCallLog(Base):
    """A record of one backoffice staff member's phone call to a hotel,
    verifying/updating its details. hotels.call_status always reflects the
    most recent entry here; this table is the full history."""
    __tablename__ = "hotel_call_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    backoffice_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    call_status = Column(String(20), nullable=False)
    call_notes = Column(Text, default="")
    called_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    hotel = relationship("Hotel")
    backoffice_user = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "hotel_id": self.hotel_id,
            "backoffice_user_id": self.backoffice_user_id,
            "call_status": self.call_status,
            "call_notes": self.call_notes,
            "called_at": self.called_at.isoformat() if self.called_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CashierAssignment(Base):
    __tablename__ = "cashier_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cashier_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    cashier = relationship("User", foreign_keys=[cashier_id], back_populates="cashier_assignments")
    hotel = relationship("Hotel")
    assigner = relationship("User", foreign_keys=[assigned_by])

    def to_dict(self):
        return {
            "id": self.id,
            "cashier_id": self.cashier_id,
            "hotel_id": self.hotel_id,
            "assigned_by": self.assigned_by,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CashierActivityLog(Base):
    __tablename__ = "cashier_activity_log"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cashier_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hotel_id = Column(String(36), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50), nullable=False, index=True)
    payment_method = Column(String(20), nullable=True)
    amount_tzs = Column(Integer, default=0)
    guest_name = Column(String(255), default="")
    room_type_name = Column(String(100), default="")
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    cashier = relationship("User", back_populates="activity_logs")
    hotel = relationship("Hotel")
    booking = relationship("Booking")

    __table_args__ = (
        Index('ix_activity_cashier_time', 'cashier_id', 'timestamp'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "cashier_id": self.cashier_id,
            "hotel_id": self.hotel_id,
            "booking_id": self.booking_id,
            "action_type": self.action_type,
            "payment_method": self.payment_method,
            "amount_tzs": self.amount_tzs,
            "guest_name": self.guest_name,
            "room_type_name": self.room_type_name,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    city_override = Column(String(100), nullable=True)
    total = Column(Integer, default=0)
    imported = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    errors = Column(JSON, default=list)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    hotels = relationship("Hotel", back_populates="import_batch")
    creator = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "city_override": self.city_override,
            "total": self.total,
            "imported": self.imported,
            "skipped": self.skipped,
            "errors": self.errors or [],
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ImportPreview(Base):
    """Temporary storage for import previews - persists across Cloud Run requests."""
    __tablename__ = "import_previews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    preview_data = Column(JSON, nullable=False)  # Stores the list of preview items
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For cleanup

    def to_dict(self):
        return {
            "id": self.id,
            "preview_data": self.preview_data,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
