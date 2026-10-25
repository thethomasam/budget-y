from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import RecurringItem, User

router = APIRouter(tags=["recurring"])


class RecurringIn(BaseModel):
    name: str = Field(min_length=1)
    amount: float = Field(gt=0)
    frequency: Literal["weekly", "fortnightly", "monthly"]
    kind: Literal["income", "expense"]


class RecurringOut(RecurringIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


@router.get("/recurring", response_model=list[RecurringOut])
def list_recurring(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(RecurringItem)
        .filter(RecurringItem.user_id == user.id)
        .order_by(RecurringItem.kind, RecurringItem.name)
        .all()
    )


@router.post("/recurring", response_model=RecurringOut, status_code=201)
def add_recurring(
    payload: RecurringIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    item = RecurringItem(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/recurring/{item_id}", status_code=204)
def delete_recurring(
    item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    item = db.get(RecurringItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    db.delete(item)
    db.commit()
