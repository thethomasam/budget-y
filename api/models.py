from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    merchant: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    card: Mapped[str] = mapped_column(String, nullable=False)  # last 4 digits only
    description: Mapped[str] = mapped_column(String, default="", nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )

    category: Mapped["Category | None"] = relationship(back_populates="transactions")


class RecurringItem(Base):
    """A regular income or expense that never appears in the card CSVs
    (salary, rent, ...), used to work out savings."""

    __tablename__ = "recurring_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    frequency: Mapped[str] = mapped_column(String, nullable=False)  # weekly | fortnightly | monthly
    kind: Mapped[str] = mapped_column(String, nullable=False)  # income | expense
