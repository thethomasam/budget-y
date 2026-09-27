import csv
import io
from abc import ABC, abstractmethod
from datetime import date as date_type
from datetime import datetime

DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y")


class CsvParseError(ValueError):
    """Raised when a CSV doesn't match the shape a parser expects."""


def parse_date(value: str) -> date_type:
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise CsvParseError(f"Unrecognized date format: {value!r}")


class BankCsvParser(ABC):
    """Base class for one bank/card CSV export shape """

    @abstractmethod
    def can_parse(self, content: str) -> bool: ...

    @abstractmethod
    def parse(self, content: str) -> list[dict]: ...


class HeaderedCsvParser(BankCsvParser):
    """Generic headered CSV: requires an amount column and a merchant name
    column under either "merchant" or "description"; card/date optional."""

    required_columns = {"amount"}
    merchant_aliases = ("merchant", "description")

    def can_parse(self, content: str) -> bool:
        try:
            return csv.Sniffer().has_header(content[:2048])
        except csv.Error:
            return False

    def parse(self, content: str) -> list[dict]:
        reader = csv.DictReader(io.StringIO(content))
        columns = {name.strip().lower() for name in reader.fieldnames or []}
        if not self.required_columns.issubset(columns) or not columns & set(
            self.merchant_aliases
        ):
            raise CsvParseError(
                f"CSV must have an {'/'.join(sorted(self.required_columns))} column "
                f"and one of: {', '.join(self.merchant_aliases)}"
            )
        rows = [
            {key.strip().lower(): (value or "").strip() for key, value in row.items()}
            for row in reader
        ]
        for row in rows:
            if not row.get("merchant"):
                row["merchant"] = row.pop("description", "")
        return rows


class AnzHeaderlessCsvParser(BankCsvParser):
    """ANZ export with no header row: date, "amount", description (no card column)."""

    columns = ["date", "amount", "merchant"]

    def can_parse(self, content: str) -> bool:
        try:
            return not csv.Sniffer().has_header(content[:2048])
        except csv.Error:
            return True

    def parse(self, content: str) -> list[dict]:
        return [
            dict(zip(self.columns, (cell.strip() for cell in row)), card="")
            for row in csv.reader(io.StringIO(content))
            if row
        ]

PARSERS: list[BankCsvParser] = [HeaderedCsvParser(), AnzHeaderlessCsvParser()]


def parse_csv(content: str) -> list[dict]:
    for parser in PARSERS:
        if parser.can_parse(content):
            return parser.parse(content)
    raise CsvParseError("Unrecognized CSV format")
