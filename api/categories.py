from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from database import get_db
from models import Category, Transaction

router = APIRouter(tags=["categories"])


class CategoryIn(BaseModel):
    name: str


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category.name).order_by(Category.name).all()
    return [row[0] for row in rows]


@router.post("/categories", response_model=CategoryOut, status_code=201)
def add_category(payload: CategoryIn, db: Session = Depends(get_db)):
    if db.query(Category).filter(Category.name == payload.name).first() is not None:
        raise HTTPException(status_code=409, detail="Category already exists")
    category = Category(name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{name}", response_model=CategoryOut)
def update_category(name: str, payload: CategoryIn, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.name == name).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if (
        payload.name != name
        and db.query(Category).filter(Category.name == payload.name).first() is not None
    ):
        raise HTTPException(status_code=409, detail="Category already exists")
    category.name = payload.name
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{name}", status_code=204)
def delete_category(name: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.name == name).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.query(Transaction).filter(Transaction.category_id == category.id).update(
        {"category_id": None}
    )
    db.delete(category)
    db.commit()
