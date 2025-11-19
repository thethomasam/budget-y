from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    merchant = Column(String, nullable=True)
    category = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    card = Column(String, nullable=True)
