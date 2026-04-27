from __future__ import annotations

from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

try:
    from api import models, schemas
    from api.database import get_db
    from api.services.telegram import send_booking_notification
except ImportError:
    import models, schemas  # type: ignore
    from database import get_db  # type: ignore
    from services.telegram import send_booking_notification  # type: ignore

import hashlib
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["booking"])


def _calculate_price(service: models.Service, vehicle_class: models.VehicleClass) -> int:
    base = service.price_from or 0
    multiplier = vehicle_class.price_multiplier or 100
    return max(int(base * multiplier / 100), 0)


def _ip_hash(request: Request) -> str | None:
    xff = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    ip = xff or (request.headers.get("x-real-ip") or "").strip() or (
        request.client.host if request.client else ""
    )
    if not ip:
        return None
    salt = (os.getenv("REVIEW_SALT") or "almadrive").strip()
    return hashlib.sha256(f"{ip}|{salt}".encode()).hexdigest()


@router.get("/services", response_model=List[schemas.ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return (
        db.query(models.Service)
        .filter(models.Service.is_active.is_(True))
        .order_by(models.Service.id.asc())
        .all()
    )


@router.get("/vehicle-classes", response_model=List[schemas.VehicleClassOut])
def list_vehicle_classes(db: Session = Depends(get_db)):
    return (
        db.query(models.VehicleClass)
        .filter(models.VehicleClass.is_active.is_(True))
        .order_by(models.VehicleClass.id.asc())
        .all()
    )


@router.post("/calculate-booking-price", response_model=schemas.BookingPriceCalculateResponse)
def calculate_price(payload: schemas.BookingPriceCalculateRequest, db: Session = Depends(get_db)):
    service = db.query(models.Service).filter(
        models.Service.id == payload.service_id,
        models.Service.is_active.is_(True),
    ).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    vehicle_class = db.query(models.VehicleClass).filter(
        models.VehicleClass.id == payload.vehicle_class_id,
        models.VehicleClass.is_active.is_(True),
    ).first()
    if not vehicle_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle class not found")

    return schemas.BookingPriceCalculateResponse(
        service_id=service.id,
        vehicle_class_id=vehicle_class.id,
        service_name=service.name,
        vehicle_class_name=vehicle_class.name,
        base_price=service.price_from or 0,
        price_multiplier=vehicle_class.price_multiplier,
        estimated_price=_calculate_price(service, vehicle_class),
        disclaimer="Итоговая цена зависит от деталей маршрута и уточняется при подтверждении.",
    )


@router.post("/booking-requests", response_model=schemas.BookingRequestOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: schemas.BookingRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = db.query(models.Service).filter(
        models.Service.id == payload.service_id,
        models.Service.is_active.is_(True),
    ).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    vehicle_class = db.query(models.VehicleClass).filter(
        models.VehicleClass.id == payload.vehicle_class_id,
        models.VehicleClass.is_active.is_(True),
    ).first()
    if not vehicle_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle class not found")

    estimated_price = payload.estimated_price
    if estimated_price is None:
        estimated_price = _calculate_price(service, vehicle_class)

    booking = models.BookingRequest(
        service_id=payload.service_id,
        vehicle_class_id=payload.vehicle_class_id,
        service_date=payload.service_date,
        contact=payload.contact.strip(),
        comment=(payload.comment or "").strip() or None,
        status="new",
        estimated_price=estimated_price,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    date_str = payload.service_date.strftime("%d.%m.%Y %H:%M")
    background_tasks.add_task(
        send_booking_notification,
        booking_id=booking.id,
        service_name=service.name,
        vehicle_class_name=vehicle_class.name,
        service_date=date_str,
        contact=booking.contact,
        comment=booking.comment,
        estimated_price=booking.estimated_price,
    )

    return booking
