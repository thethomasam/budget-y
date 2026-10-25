from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import Category, Transaction, User

router = APIRouter(tags=["categories"])


class CategoryIn(BaseModel):
    name: str
    budget: float = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    budget: float | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    budget: float


def _find(db: Session, user: User, name: str) -> Category | None:
    return db.query(Category).filter(Category.user_id == user.id, Category.name == name).first()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Category).filter(Category.user_id == user.id).order_by(Category.name).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def add_category(
    payload: CategoryIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if _find(db, user, payload.name) is not None:
        raise HTTPException(status_code=409, detail="Category already exists")
    category = Category(user_id=user.id, name=payload.name, budget=payload.budget)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{name:path}",response_model=CategoryOut)
def update_category(
    name: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    category = _find(db, user, name)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] != name:
        if _find(db, user, updates["name"]) is not None:
            raise HTTPException(status_code=409, detail="Category already exists")
    for field, value in updates.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{name:path}",status_code=204)
def delete_category(
    name: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    category = _find(db, user, name)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.query(Transaction).filter(Transaction.category_id == category.id).update(
        {"category_id": None}
    )
    db.delete(category)
    db.commit()
