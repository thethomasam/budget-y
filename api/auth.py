import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, update
from sqlalchemy.orm import Session

from database import get_db
from models import Category, LoginSession, RecurringItem, Transaction, User

router = APIRouter(tags=["auth"])
_bearer = HTTPBearer(auto_error=False)

SESSION_DAYS = 30
_USERNAME_RE = re.compile(r"^[a-z0-9_.-]{2,30}$")


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return False
    salt_hex, digest_hex = stored.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest, bytes.fromhex(digest_hex))


def _start_session(user: User, db: Session) -> "AuthOut":
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token=token, user_id=user.id))
    db.commit()
    return AuthOut(token=token, username=user.username)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    session = db.get(LoginSession, credentials.credentials) if credentials else None
    expired = session is not None and session.created_at.replace(tzinfo=timezone.utc) < (
        datetime.now(timezone.utc) - timedelta(days=SESSION_DAYS)
    )
    if session is None or expired:
        raise HTTPException(status_code=401, detail="Not signed in")
    return db.get(User, session.user_id)


class Credentials(BaseModel):
    username: str
    password: str = Field(min_length=8)


class AuthOut(BaseModel):
    token: str
    username: str


@router.post("/auth/register", response_model=AuthOut, status_code=201)
def register(payload: Credentials, db: Session = Depends(get_db)):
    username = payload.username.strip()
    if not _USERNAME_RE.match(username.lower()):
        raise HTTPException(
            status_code=422, detail="Username must be 2-30 letters, numbers, dots, dashes or underscores"
        )
    if db.query(User).filter(func.lower(User.username) == username.lower()).first() is not None:
        raise HTTPException(status_code=409, detail="Username already taken")

    is_first_user = db.query(User).count() == 0
    user = User(username=username, password_hash=_hash_password(payload.password))
    db.add(user)
    db.flush()
    if is_first_user:
        # Data from before accounts existed belongs to the first user.
        for model in (Category, Transaction, RecurringItem):
            db.execute(update(model).where(model.user_id.is_(None)).values(user_id=user.id))
    db.commit()
    return _start_session(user, db)


@router.post("/auth/login", response_model=AuthOut)
def login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.username) == payload.username.strip().lower()).first()
    if user is None or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    return _start_session(user, db)


@router.post("/auth/logout", status_code=204)
def logout(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)):
    session = db.get(LoginSession, credentials.credentials) if credentials else None
    if session is not None:
        db.delete(session)
        db.commit()
