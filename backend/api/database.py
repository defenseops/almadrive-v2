from __future__ import annotations

import os
import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _is_production() -> bool:
    return os.getenv("ENVIRONMENT", "development").strip().lower() in {"prod", "production"}


def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    if _is_production():
        raise RuntimeError("DATABASE_URL is required in production")

    logger.warning("DATABASE_URL not set — falling back to SQLite for development")
    return "sqlite:///./almadrive_dev.db"


def _build_engine():
    url = _get_database_url()
    is_sqlite = "sqlite" in url

    connect_args = {"check_same_thread": False} if is_sqlite else {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

    kwargs: dict = {
        "pool_pre_ping": True,
        "echo": False,
        "connect_args": connect_args,
    }
    if not is_sqlite:
        kwargs.update({"pool_size": 5, "max_overflow": 10, "pool_recycle": 300, "pool_timeout": 30})

    return create_engine(url, **kwargs)


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError:
        db.rollback()
        raise
    finally:
        db.close()


def create_tables() -> None:
    try:
        from api import models  # noqa: F401
    except ImportError:
        import models  # type: ignore  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured")
