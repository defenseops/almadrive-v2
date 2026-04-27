from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

try:
    from api.database import Base
except ImportError:
    from database import Base  # type: ignore


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price_from = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bookings = relationship("BookingRequest", back_populates="service")


class VehicleClass(Base):
    __tablename__ = "vehicle_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    # 100 = base price, 150 = +50%
    price_multiplier = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bookings = relationship("BookingRequest", back_populates="vehicle_class")


class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    vehicle_class_id = Column(Integer, ForeignKey("vehicle_classes.id"), nullable=False, index=True)
    service_date = Column(DateTime(timezone=False), nullable=False)
    contact = Column(String(255), nullable=False)
    comment = Column(Text, nullable=True)
    # new | confirmed | in_progress | done | cancelled
    status = Column(String(50), nullable=False, default="new")
    estimated_price = Column(Integer, nullable=True)
    actual_price = Column(Integer, nullable=True)
    # 'owner' or 'hired'
    executor = Column(String(10), nullable=True)
    owner_earnings = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    service = relationship("Service", back_populates="bookings")
    vehicle_class = relationship("VehicleClass", back_populates="bookings")


class ServiceReview(Base):
    __tablename__ = "service_reviews"

    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String(120), nullable=True)
    rating = Column(Integer, nullable=False)  # 1..5
    text = Column(Text, nullable=False)
    is_approved = Column(Boolean, nullable=False, default=False)
    ip_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
