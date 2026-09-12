"""Add backoffice role support: hotels.call_status, hotels.updated_at, hotel_call_logs table

Revision ID: 004_add_backoffice
Revises: 003_add_hotel_reports
Create Date: 2026-09-12 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_backoffice'
down_revision: Union[str, None] = '003_add_hotel_reports'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('hotels', sa.Column('call_status', sa.String(20), nullable=True, server_default='pending'))
    op.add_column('hotels', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_hotels_call_status', 'hotels', ['call_status'])

    op.create_table(
        'hotel_call_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('backoffice_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('call_status', sa.String(20), nullable=False),
        sa.Column('call_notes', sa.Text(), nullable=True, server_default=''),
        sa.Column('called_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_hotel_call_logs_hotel_id', 'hotel_call_logs', ['hotel_id'])
    op.create_index('ix_hotel_call_logs_created_at', 'hotel_call_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_hotel_call_logs_created_at', table_name='hotel_call_logs')
    op.drop_index('ix_hotel_call_logs_hotel_id', table_name='hotel_call_logs')
    op.drop_table('hotel_call_logs')

    op.drop_index('ix_hotels_call_status', table_name='hotels')
    op.drop_column('hotels', 'updated_at')
    op.drop_column('hotels', 'call_status')
