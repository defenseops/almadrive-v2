from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

try:
    from api import models, schemas
    from api.auth import create_access_token, get_current_admin, verify_login
    from api.database import get_db
except ImportError:
    import models, schemas  # type: ignore
    from auth import create_access_token, get_current_admin, verify_login  # type: ignore
    from database import get_db  # type: ignore

router = APIRouter(prefix="/api", tags=["admin"])


# ── Auth ─────────────────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest):
    if not verify_login(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_access_token(payload.username)
    return schemas.TokenResponse(access_token=token)


# ── Booking requests ──────────────────────────────────────────────────────────

@router.get("/admin/booking-requests", response_model=List[schemas.BookingRequestOut])
def list_bookings(
    booking_status: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(models.BookingRequest)
    if booking_status:
        q = q.filter(models.BookingRequest.status == booking_status)
    return q.order_by(models.BookingRequest.id.desc()).limit(limit).all()


@router.get("/admin/booking-requests/{booking_id}", response_model=schemas.BookingRequestOut)
def get_booking(
    booking_id: int,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(models.BookingRequest).filter(models.BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


@router.patch("/admin/booking-requests/{booking_id}/status", response_model=schemas.BookingRequestOut)
def update_booking_status(
    booking_id: int,
    payload: schemas.BookingStatusUpdate,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(models.BookingRequest).filter(models.BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if payload.status == "done" and not booking.executor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя завершить заказ без указания исполнителя и итоговой стоимости",
        )
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/admin/booking-requests/{booking_id}/assignment", response_model=schemas.BookingRequestOut)
def update_booking_assignment(
    booking_id: int,
    payload: schemas.BookingAssignmentUpdate,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(models.BookingRequest).filter(models.BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    booking.executor = payload.executor
    booking.actual_price = payload.actual_price
    booking.owner_earnings = payload.actual_price if payload.executor == "owner" else payload.actual_price * 20 // 100
    booking.status = "done"
    db.commit()
    db.refresh(booking)
    return booking


# ── Services tariffs ──────────────────────────────────────────────────────────

@router.get("/admin/services", response_model=List[schemas.ServiceOut])
def admin_list_services(
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.Service).order_by(models.Service.id.asc()).all()


@router.put("/admin/services/{service_id}/price", response_model=schemas.ServiceOut)
def update_service_price(
    service_id: int,
    payload: schemas.ServicePriceUpdate,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    service.price_from = payload.price_from
    db.commit()
    db.refresh(service)
    return service


# ── Vehicle classes ───────────────────────────────────────────────────────────

@router.get("/admin/vehicle-classes", response_model=List[schemas.VehicleClassOut])
def admin_list_vehicle_classes(
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.VehicleClass).order_by(models.VehicleClass.id.asc()).all()


@router.put("/admin/vehicle-classes/{class_id}/multiplier", response_model=schemas.VehicleClassOut)
def update_vehicle_class_multiplier(
    class_id: int,
    payload: schemas.VehicleClassMultiplierUpdate,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    vc = db.query(models.VehicleClass).filter(models.VehicleClass.id == class_id).first()
    if not vc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle class not found")
    vc.price_multiplier = payload.price_multiplier
    db.commit()
    db.refresh(vc)
    return vc


# ── Reviews moderation ────────────────────────────────────────────────────────

@router.get("/admin/service-reviews", response_model=List[schemas.ServiceReviewOut])
def admin_list_all_reviews(
    limit: int = Query(default=100, ge=1, le=500),
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ServiceReview)
        .order_by(models.ServiceReview.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/admin/service-reviews/pending", response_model=List[schemas.ServiceReviewOut])
def list_pending_reviews(
    limit: int = Query(default=20, ge=1, le=100),
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ServiceReview)
        .filter(models.ServiceReview.is_approved.is_(False))
        .order_by(models.ServiceReview.id.desc())
        .limit(limit)
        .all()
    )


@router.put("/admin/service-reviews/{review_id}/approve", response_model=schemas.ServiceReviewOut)
def approve_review(
    review_id: int,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    review = db.query(models.ServiceReview).filter(models.ServiceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.is_approved = True
    db.commit()
    db.refresh(review)
    return review


@router.put("/admin/service-reviews/{review_id}/hide", response_model=schemas.ServiceReviewOut)
def hide_review(
    review_id: int,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    review = db.query(models.ServiceReview).filter(models.ServiceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.is_approved = False
    db.commit()
    db.refresh(review)
    return review


@router.delete("/admin/service-reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    _admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    review = db.query(models.ServiceReview).filter(models.ServiceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    db.delete(review)
    db.commit()
    return None
