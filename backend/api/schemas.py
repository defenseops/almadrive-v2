from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ── Services ────────────────────────────────────────────────────────────────

class ServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price_from: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ServicePriceUpdate(BaseModel):
    price_from: int = Field(ge=0)


# ── Vehicle classes ──────────────────────────────────────────────────────────

class VehicleClassOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price_multiplier: int
    is_active: bool

    model_config = {"from_attributes": True}


class VehicleClassMultiplierUpdate(BaseModel):
    price_multiplier: int = Field(ge=1)


# ── Booking ──────────────────────────────────────────────────────────────────

class BookingPriceCalculateRequest(BaseModel):
    service_id: int
    vehicle_class_id: int


class BookingPriceCalculateResponse(BaseModel):
    service_id: int
    vehicle_class_id: int
    service_name: str
    vehicle_class_name: str
    base_price: int
    price_multiplier: int
    estimated_price: int
    currency: str = "KZT"
    disclaimer: str


class BookingRequestCreate(BaseModel):
    service_id: int
    vehicle_class_id: int
    service_date: datetime
    contact: str = Field(min_length=5, max_length=255)
    comment: Optional[str] = Field(default=None, max_length=1000)
    estimated_price: Optional[int] = None

    @field_validator("contact")
    @classmethod
    def contact_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("contact must not be blank")
        return v.strip()


class BookingRequestOut(BaseModel):
    id: int
    service_id: int
    vehicle_class_id: int
    service_date: datetime
    contact: str
    comment: Optional[str] = None
    status: str
    estimated_price: Optional[int] = None
    actual_price: Optional[int] = None
    executor: Optional[str] = None
    owner_earnings: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BookingStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(new|confirmed|in_progress|done|cancelled)$")


class BookingAssignmentUpdate(BaseModel):
    executor: str = Field(pattern=r"^(owner|hired)$")
    actual_price: int = Field(ge=0)


# ── Reviews ──────────────────────────────────────────────────────────────────

class ServiceReviewCreate(BaseModel):
    author_name: Optional[str] = Field(default=None, max_length=120)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=5, max_length=2000)

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be blank")
        return v.strip()


class ServiceReviewOut(BaseModel):
    id: int
    author_name: Optional[str] = None
    rating: int
    text: str
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
