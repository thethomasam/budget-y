from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class TransactionText(BaseModel):
    text: str


class CategorizeRequest(BaseModel):
    transactions: List[str]


class CategoryUpdate(BaseModel):
    category: str


class BulkCategoryUpdate(BaseModel):
    transaction_ids: List[int]
    category: str


class TransactionCreate(BaseModel):
    merchant: Optional[str] = None
    category: Optional[str] = None
    amount: float
    card: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    date: date
    merchant: Optional[str]
    category: Optional[str]
    amount: float
    card: Optional[str]

    class Config:
        from_attributes = True
