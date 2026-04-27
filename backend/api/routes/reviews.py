from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

try:
    from api import models, schemas
    from api.database import get_db
except ImportError:
    import models, schemas  # type: ignore
    from database import get_db  # type: ignore

router = APIRouter(prefix="/api", tags=["reviews"])


def _rate_limit_seconds() -> int:
    try:
        v = int(os.getenv("REVIEW_RATE_LIMIT_SECONDS", "60"))
        return max(1, min(v, 86400))
    except ValueError:
        return 60


def _ip_hash(request: Request) -> str | None:
    xff = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    ip = xff or (request.headers.get("x-real-ip") or "").strip() or (
        request.client.host if request.client else ""
    )
    if not ip:
        return None
    salt = (os.getenv("REVIEW_SALT") or "almadrive").strip()
    return hashlib.sha256(f"{ip}|{salt}".encode()).hexdigest()


@router.get("/service-reviews", response_model=List[schemas.ServiceReviewOut])
def list_service_reviews(
    approved_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(models.ServiceReview)
    if approved_only:
        q = q.filter(models.ServiceReview.is_approved.is_(True))
    return q.order_by(models.ServiceReview.id.desc()).limit(limit).all()


@router.post("/service-reviews", response_model=schemas.ServiceReviewOut, status_code=status.HTTP_201_CREATED)
def create_service_review(
    payload: schemas.ServiceReviewCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_hash = _ip_hash(request)

    if ip_hash:
        limit_seconds = _rate_limit_seconds()
        since = datetime.utcnow() - timedelta(seconds=limit_seconds)
        recent = (
            db.query(models.ServiceReview)
            .filter(models.ServiceReview.ip_hash == ip_hash)
            .filter(models.ServiceReview.created_at >= since)
            .first()
        )
        if recent:
            elapsed = (datetime.utcnow() - recent.created_at).total_seconds()
            wait = max(0, int(limit_seconds - elapsed))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many reviews. Try again in {wait} seconds.",
            )

    review = models.ServiceReview(
        author_name=payload.author_name or None,
        rating=payload.rating,
        text=payload.text.strip(),
        is_approved=False,
        ip_hash=ip_hash,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
