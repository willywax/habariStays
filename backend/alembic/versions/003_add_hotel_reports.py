"""Add hotel_reports table for the "Report incorrect info" feature

Revision ID: 003_add_hotel_reports
Revises: 002_add_import_previews
Create Date: 2026-09-12 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_hotel_reports'
down_revision: Union[str, None] = '002_add_import_previews'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'hotel_reports',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('hotel_id', sa.String(36), sa.ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reporter_email', sa.String(255), nullable=True),
        sa.Column('field_reported', sa.String(20), nullable=False),
        sa.Column('note', sa.Text(), nullable=True, server_default=''),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_hotel_reports_hotel_id', 'hotel_reports', ['hotel_id'])
    op.create_index('ix_hotel_reports_resolved', 'hotel_reports', ['resolved'])
    op.create_index('ix_hotel_reports_created_at', 'hotel_reports', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_hotel_reports_created_at', table_name='hotel_reports')
    op.drop_index('ix_hotel_reports_resolved', table_name='hotel_reports')
    op.drop_index('ix_hotel_reports_hotel_id', table_name='hotel_reports')
    op.drop_table('hotel_reports')
