"""Add import_previews table for persistent preview storage

Revision ID: 002_add_import_previews
Revises: 001_initial
Create Date: 2025-01-01 00:00:00.000000

This migration adds the import_previews table to store import preview data
persistently in the database instead of in-memory storage, which is required
for Cloud Run deployments.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_add_import_previews'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create import_previews table
    op.create_table(
        'import_previews',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('preview_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_import_previews_created_at', 'import_previews', ['created_at'])
    op.create_index('ix_import_previews_expires_at', 'import_previews', ['expires_at'])


def downgrade() -> None:
    op.drop_index('ix_import_previews_expires_at', table_name='import_previews')
    op.drop_index('ix_import_previews_created_at', table_name='import_previews')
    op.drop_table('import_previews')
