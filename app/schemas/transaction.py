from pydantic import BaseModel, field_validator
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
    amount: Optional[float] = None
    card: Optional[str] = None

    @field_validator('amount', mode='before')
    @classmethod
    def parse_amount(cls, v):
        if v is None or v == '':
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid amount: {v}")


class TransactionResponse(BaseModel):
    id: int
    date: date
    merchant: Optional[str]
    category: Optional[str]
    amount: float
    card: Optional[str]

    class Config:
        from_attributes = True
