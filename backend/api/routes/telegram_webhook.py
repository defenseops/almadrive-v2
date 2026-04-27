from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

try:
    from api.database import get_db
    from api.services.telegram import handle_update
except ImportError:
    from database import get_db  # type: ignore
    from services.telegram import handle_update  # type: ignore

router = APIRouter(prefix="/api", tags=["telegram"])


@router.post("/telegram/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    update = await request.json()
    await handle_update(update, db)
    return {"ok": True}
