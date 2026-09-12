"""Add the business analytics event store.

Revision ID: 005_add_analytics_events
Revises: 004_add_backoffice
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_add_analytics_events"
down_revision = "004_add_backoffice"
branch_labels = None
depends_on = None

event_type = sa.Enum(
    "hotel_search",
    "hotel_view",
    "whatsapp_click",
    "phone_revealed",
    "zero_results",
    "report_submitted",
    name="analytics_event_type",
)


def upgrade():
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_type", event_type, nullable=False),
        sa.Column(
            "hotel_id", sa.String(36), sa.ForeignKey("hotels.id", ondelete="SET NULL")
        ),
        sa.Column("city", sa.String(100)),
        sa.Column("session_id", sa.String(255)),
        sa.Column("budget_min", sa.Integer()),
        sa.Column("budget_max", sa.Integer()),
        sa.Column("results_count", sa.Integer()),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    for column in ("event_type", "city", "created_at", "hotel_id"):
        op.create_index(f"ix_analytics_events_{column}", "analytics_events", [column])


def downgrade():
    op.drop_table("analytics_events")
    event_type.drop(op.get_bind(), checkfirst=True)
