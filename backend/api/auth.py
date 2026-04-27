from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    s = (os.getenv("JWT_SECRET") or "").strip()
    if not s:
        raise RuntimeError("JWT_SECRET env var is required")
    return s


def _expire_hours() -> int:
    try:
        return max(1, int(os.getenv("JWT_EXPIRE_HOURS", "24")))
    except ValueError:
        return 24


def _admin_creds() -> tuple[str, str]:
    user = (os.getenv("ADMIN_USERNAME") or "").strip()
    pwd = (os.getenv("ADMIN_PASSWORD") or "").strip()
    return user, pwd


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(tz=timezone.utc) + timedelta(hours=_expire_hours()),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def verify_login(username: str, password: str) -> bool:
    admin_user, admin_pwd = _admin_creds()
    if not admin_user or not admin_pwd:
        return False
    ok_user = secrets.compare_digest(username, admin_user)
    ok_pwd = secrets.compare_digest(password, admin_pwd)
    return ok_user and ok_pwd


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise exc
    try:
        payload = jwt.decode(credentials.credentials, _secret(), algorithms=["HS256"])
        sub: str = payload.get("sub", "")
        if not sub:
            raise exc
        return sub
    except jwt.PyJWTError:
        raise exc
