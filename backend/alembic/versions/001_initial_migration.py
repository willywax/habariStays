"""Initial migration - Create all tables for Habari Stays

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

This migration creates the complete database schema for the Habari Stays
hotel booking platform migrated from MongoDB to PostgreSQL.

Tables created:
- users: Platform users (admin, owner, cashier, guest)
- user_sessions: Active user sessions with refresh tokens
- hotels: Hotel/property listings
- room_types: Room categories within hotels
- bookings: Guest reservations
- reviews: Guest reviews for bookings
- cashier_assignments: Cashier-to-hotel assignments
- cashier_activity_log: Cashier action audit trail
- import_batches: Bulk data import tracking
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='guest'),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('business_name', sa.String(255), nullable=True),
        sa.Column('managed_hotels', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('email', name='uq_users_email')
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role', 'users', ['role'])
    op.create_index('ix_users_status', 'users', ['status'])

    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('refresh_token', sa.String(512), nullable=False),
        sa.Column('device_info', sa.String(255), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true')
    )
    op.create_index('ix_user_sessions_user_id', 'user_sessions', ['user_id'])
    op.create_index('ix_user_sessions_refresh_token', 'user_sessions', ['refresh_token'])
    op.create_index('ix_user_sessions_is_active', 'user_sessions', ['is_active'])

    # Create hotels table
    op.create_table(
        'hotels',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amenities', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('photos', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('star_rating', sa.Integer(), nullable=True),
        sa.Column('owner_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('check_in_time', sa.String(10), nullable=True, server_default='14:00'),
        sa.Column('check_out_time', sa.String(10), nullable=True, server_default='10:00'),
        sa.Column('cancellation_policy', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('name', name='uq_hotels_name')
    )
    op.create_index('ix_hotels_name', 'hotels', ['name'])
    op.create_index('ix_hotels_city', 'hotels', ['city'])
    op.create_index('ix_hotels_owner_id', 'hotels', ['owner_id'])
    op.create_index('ix_hotels_status', 'hotels', ['status'])

    # Create room_types table
    op.create_table(
        'room_types',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('price_per_night', sa.Float(), nullable=False),
        sa.Column('total_rooms', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('amenities', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('photos', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('bed_type', sa.String(100), nullable=True),
        sa.Column('size_sqm', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    op.create_index('ix_room_types_hotel_id', 'room_types', ['hotel_id'])
    op.create_index('ix_room_types_status', 'room_types', ['status'])

    # Create bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('booking_reference', sa.String(20), nullable=False),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('room_type_id', sa.String(36), sa.ForeignKey('room_types.id', ondelete='CASCADE'), nullable=False),
        sa.Column('guest_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('guest_name', sa.String(255), nullable=False),
        sa.Column('guest_email', sa.String(255), nullable=True),
        sa.Column('guest_phone', sa.String(50), nullable=True),
        sa.Column('check_in_date', sa.Date(), nullable=False),
        sa.Column('check_out_date', sa.Date(), nullable=False),
        sa.Column('num_guests', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('num_rooms', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='TZS'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('payment_status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('transaction_id', sa.String(100), nullable=True),
        sa.Column('special_requests', sa.Text(), nullable=True),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_by', sa.String(36), nullable=True),
        sa.Column('checked_in_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checked_in_by', sa.String(36), nullable=True),
        sa.Column('checked_out_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checked_out_by', sa.String(36), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('booking_reference', name='uq_bookings_reference')
    )
    op.create_index('ix_bookings_booking_reference', 'bookings', ['booking_reference'])
    op.create_index('ix_bookings_hotel_id', 'bookings', ['hotel_id'])
    op.create_index('ix_bookings_guest_id', 'bookings', ['guest_id'])
    op.create_index('ix_bookings_status', 'bookings', ['status'])
    op.create_index('ix_bookings_payment_status', 'bookings', ['payment_status'])
    op.create_index('ix_bookings_check_in_date', 'bookings', ['check_in_date'])
    op.create_index('ix_bookings_check_out_date', 'bookings', ['check_out_date'])

    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('booking_id', sa.String(36), sa.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('guest_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('response_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='published'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('booking_id', name='uq_reviews_booking_id')
    )
    op.create_index('ix_reviews_hotel_id', 'reviews', ['hotel_id'])
    op.create_index('ix_reviews_guest_id', 'reviews', ['guest_id'])
    op.create_index('ix_reviews_status', 'reviews', ['status'])
    op.create_index('ix_reviews_rating', 'reviews', ['rating'])

    # Create cashier_assignments table
    op.create_table(
        'cashier_assignments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('cashier_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assigned_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('permissions', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='["check_in", "check_out", "view_bookings"]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('cashier_id', 'hotel_id', name='uq_cashier_hotel')
    )
    op.create_index('ix_cashier_assignments_cashier_id', 'cashier_assignments', ['cashier_id'])
    op.create_index('ix_cashier_assignments_hotel_id', 'cashier_assignments', ['hotel_id'])
    op.create_index('ix_cashier_assignments_status', 'cashier_assignments', ['status'])

    # Create cashier_activity_log table
    op.create_table(
        'cashier_activity_log',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('cashier_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('booking_id', sa.String(36), nullable=True),
        sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    op.create_index('ix_cashier_activity_log_cashier_id', 'cashier_activity_log', ['cashier_id'])
    op.create_index('ix_cashier_activity_log_hotel_id', 'cashier_activity_log', ['hotel_id'])
    op.create_index('ix_cashier_activity_log_action', 'cashier_activity_log', ['action'])
    op.create_index('ix_cashier_activity_log_created_at', 'cashier_activity_log', ['created_at'])

    # Create import_batches table
    op.create_table(
        'import_batches',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('filename', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='processing'),
        sa.Column('total_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('successful_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('errors', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('imported_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('ix_import_batches_type', 'import_batches', ['type'])
    op.create_index('ix_import_batches_status', 'import_batches', ['status'])
    op.create_index('ix_import_batches_imported_by', 'import_batches', ['imported_by'])


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign key dependencies)
    op.drop_table('import_batches')
    op.drop_table('cashier_activity_log')
    op.drop_table('cashier_assignments')
    op.drop_table('reviews')
    op.drop_table('bookings')
    op.drop_table('room_types')
    op.drop_table('hotels')
    op.drop_table('user_sessions')
    op.drop_table('users')
