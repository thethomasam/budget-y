import io
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List

import pandas as pd


SKIP_KEYWORDS = ["payment thankyou", "thank you", "payment thank", "payment received", "autopay"]


@dataclass
class ParsedTransaction:
    date: str        # DD/MM/YYYY
    merchant: str
    amount: float    # always positive


class BaseCSVParser(ABC):
    @abstractmethod
    def can_parse(self, text: str) -> bool:
        """Return True if this parser recognises the CSV format."""

    @abstractmethod
    def parse(self, text: str) -> List[ParsedTransaction]:
        """Parse CSV text and return a list of transactions."""

    def _is_skippable(self, merchant: str) -> bool:
        return any(kw in merchant.lower() for kw in SKIP_KEYWORDS)

    def _to_date_str(self, raw: str, fmt: str) -> str:
        return datetime.strptime(raw.strip(), fmt).strftime("%d/%m/%Y")


class ANZParser(BaseCSVParser):
    """ANZ headerless CSV: Date, Amount, Description — no header row."""

    def can_parse(self, text: str) -> bool:
        first_cell = text.split(",")[0].strip().strip('"')
        return bool(re.match(r"\d{2}/\d{2}/\d{4}", first_cell))

    def parse(self, text: str) -> List[ParsedTransaction]:
        df = pd.read_csv(io.StringIO(text), header=None, names=["Date", "Amount", "Description"])
        df["Amount"] = df["Amount"].astype(str).str.replace('"', "").astype(float)

        transactions = []
        for _, row in df.iterrows():
            merchant = str(row["Description"]).strip()
            if self._is_skippable(merchant):
                continue
            transactions.append(ParsedTransaction(
                date=self._to_date_str(str(row["Date"]), "%d/%m/%Y"),
                merchant=merchant,
                amount=abs(float(row["Amount"])),
            ))
        return transactions


class AMEXParser(BaseCSVParser):
    """AMEX headed CSV: Date, Description, Amount — with header row.

    AMEX uses positive amounts for charges and negative for credits/payments.
    """

    REQUIRED_COLUMNS = {"Date", "Description", "Amount"}

    def can_parse(self, text: str) -> bool:
        try:
            header = text.split("\n")[0]
            cols = {c.strip().strip('"') for c in header.split(",")}
            return self.REQUIRED_COLUMNS.issubset(cols)
        except Exception:
            return False

    def parse(self, text: str) -> List[ParsedTransaction]:
        df = pd.read_csv(io.StringIO(text))
        df.columns = [c.strip() for c in df.columns]

        transactions = []
        for _, row in df.iterrows():
            merchant = str(row["Description"]).strip()
            if self._is_skippable(merchant):
                continue
            amount = float(row["Amount"])
            if amount <= 0:
                continue  # skip credits/refunds
            transactions.append(ParsedTransaction(
                date=self._to_date_str(str(row["Date"]), "%d/%m/%Y"),
                merchant=merchant,
                amount=amount,
            ))
        return transactions


class CSVParser:
    """Auto-detects CSV format and delegates to the right parser."""

    _parsers: List[BaseCSVParser] = [ANZParser(), AMEXParser()]

    @classmethod
    def parse(cls, text: str) -> List[ParsedTransaction]:
        for parser in cls._parsers:
            if parser.can_parse(text):
                return parser.parse(text)
        raise ValueError(
            f"Unrecognised CSV format. Supported formats: ANZ (headerless), "
            f"AMEX (headers: {', '.join(AMEXParser.REQUIRED_COLUMNS)})"
        )
