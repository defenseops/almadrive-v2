from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

try:
    from api import models
    from api.database import SessionLocal, create_tables
    from api.routes import admin, booking, reviews, telegram_webhook
except ImportError:
    import models  # type: ignore
    from database import SessionLocal, create_tables  # type: ignore
    from routes import admin, booking, reviews, telegram_webhook  # type: ignore


BASE_DIR = Path(__file__).resolve().parent.parent

DEFAULT_SERVICES = [
    {"name": "Трансфер из аэропорта / в аэропорт", "description": "Комфортный трансфер в аэропорт и из аэропорта Алматы.", "price_from": 8000},
    {"name": "Почасовая аренда с водителем", "description": "Автомобиль с водителем для деловых встреч и поездок по городу.", "price_from": 7000},
    {"name": "Междугородние поездки", "description": "Поездки между городами Казахстана с индивидуальным расчётом маршрута.", "price_from": 10000},
    {"name": "Транспорт для мероприятий", "description": "Перевозка гостей для конференций, свадеб и корпоративных событий.", "price_from": 10000},
    {"name": "Обслуживание делегаций", "description": "Транспортное сопровождение деловых и официальных делегаций.", "price_from": 12000},
    {"name": "Туристические поездки", "description": "Индивидуальные туристические маршруты и экскурсии по Казахстану.", "price_from": 10000},
]

DEFAULT_VEHICLE_CLASSES = [
    {"name": "Бизнес-класс", "description": "Комфортные автомобили для деловых поездок.", "price_multiplier": 100},
    {"name": "Премиум-класс", "description": "Премиальные автомобили для особых случаев.", "price_multiplier": 150},
    {"name": "Минивэн", "description": "Вместительные автомобили для групп и большого багажа.", "price_multiplier": 130},
]


def _seed(db: Session) -> None:
    if db.query(models.Service.id).first() is None:
        for item in DEFAULT_SERVICES:
            db.add(models.Service(**item, is_active=True))

    if db.query(models.VehicleClass.id).first() is None:
        for item in DEFAULT_VEHICLE_CLASSES:
            db.add(models.VehicleClass(**item, is_active=True))

    db.commit()


def _fail_fast() -> None:
    if not (os.getenv("DATABASE_URL") or "").strip():
        env = (os.getenv("ENVIRONMENT") or "").strip().lower()
        if env in {"prod", "production"}:
            raise RuntimeError("DATABASE_URL is required in production")

    if (os.getenv("ENVIRONMENT") or "").strip().lower() in {"prod", "production"}:
        for var in ("ADMIN_USERNAME", "ADMIN_PASSWORD", "JWT_SECRET"):
            if not (os.getenv(var) or "").strip():
                raise RuntimeError(f"{var} is required in production")


_fail_fast()

_env = (os.getenv("ENVIRONMENT") or "development").strip().lower()
_is_prod = _env in {"prod", "production"}

app = FastAPI(
    title="AlmaDrive API",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

# CORS
_origins = [o.strip() for o in (os.getenv("ALLOWED_ORIGINS") or "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(booking.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(telegram_webhook.router)

# Static files
_static = BASE_DIR / "static"
if _static.exists():
    app.mount("/static", StaticFiles(directory=str(_static)), name="static")


@app.on_event("startup")
def on_startup() -> None:
    create_tables()
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "env": _env}
