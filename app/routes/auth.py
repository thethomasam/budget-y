import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(body: AuthRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(username=body.username, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id, user.username), "username": user.username}


@router.post("/login")
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(user.id, user.username)
    return {"access_token": token, "token_type": "bearer", "token": token, "username": user.username}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}


@router.post("/api-key")
def generate_api_key(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.api_key = secrets.token_urlsafe(32)
    db.commit()
    return {"api_key": current_user.api_key}


@router.get("/api-key")
def get_api_key(current_user: User = Depends(get_current_user)):
    if not current_user.api_key:
        raise HTTPException(status_code=404, detail="No API key yet — POST /api/auth/api-key to generate one")
    return {"api_key": current_user.api_key}
