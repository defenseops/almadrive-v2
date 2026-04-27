"""Add executor, actual_price, owner_earnings to booking_requests

Revision ID: 0002_booking_assignment
Revises: 0001_initial
Create Date: 2026-04-28

"""
from __future__ import annotations
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_booking_assignment"
down_revision: Union[str, Sequence[str], None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("booking_requests", sa.Column("actual_price", sa.Integer(), nullable=True))
    op.add_column("booking_requests", sa.Column("executor", sa.String(10), nullable=True))
    op.add_column("booking_requests", sa.Column("owner_earnings", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("booking_requests", "owner_earnings")
    op.drop_column("booking_requests", "executor")
    op.drop_column("booking_requests", "actual_price")
