"""
Isolated unit tests for app/services/qwen_categoriser.py

No Docker stack required. External deps (Ollama, Tavily, DB) are mocked.

Install test deps:
    pip install pytest pytest-asyncio

Run:
    pytest tests/test_qwen_categoriser.py -v
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.qwen_categoriser import (
    normalize_transaction,
    find_similar_transaction,
    categorize_with_llm,
    batch_categorise_with_llm,
    categorise_transaction,
    CATEGORIES,
)


# ---------------------------------------------------------------------------
# normalize_transaction — pure function, no mocks needed
# ---------------------------------------------------------------------------

class TestNormalizeTransaction:
    def test_lowercases(self):
        assert normalize_transaction("WOOLWORTHS") == "woolworths"

    def test_removes_noise_words(self):
        result = normalize_transaction("Coles PTY LTD AU")
        assert "pty" not in result
        assert "ltd" not in result
        assert "au" not in result

    def test_removes_special_chars(self):
        result = normalize_transaction("7-Eleven #42!")
        assert "#" not in result
        assert "!" not in result

    def test_collapses_whitespace(self):
        result = normalize_transaction("  big  w  ")
        assert result == "big w"

    def test_empty_string(self):
        assert normalize_transaction("") == ""

    def test_preserves_meaningful_words(self):
        result = normalize_transaction("Coles North Park")
        assert "coles" in result
        assert "north" in result
        assert "park" in result


# ---------------------------------------------------------------------------
# find_similar_transaction — mocked DB session
# ---------------------------------------------------------------------------

def _make_db(transactions):
    """Build a mock DB session that returns a given list of Transaction objects."""
    db = MagicMock()
    query = db.query.return_value
    query.filter.return_value.all.return_value = transactions
    return db


def _make_txn(merchant, category):
    t = MagicMock()
    t.merchant = merchant
    t.category = category
    return t


class TestFindSimilarTransaction:
    def test_exact_match(self):
        db = _make_db([_make_txn("Woolworths", "Food & Groceries")])
        result = find_similar_transaction("Woolworths", db)
        assert result == "Food & Groceries"

    def test_fuzzy_match(self):
        db = _make_db([_make_txn("Coles Prospect", "Food & Groceries")])
        result = find_similar_transaction("Coles North Park", db)
        assert result == "Food & Groceries"

    def test_no_match_returns_none(self):
        db = _make_db([_make_txn("Woolworths", "Food & Groceries")])
        result = find_similar_transaction("Uber Eats", db)
        assert result is None

    def test_empty_db(self):
        db = _make_db([])
        assert find_similar_transaction("Any Merchant", db) is None

    def test_merchant_with_none_skipped(self):
        txn = _make_txn(None, "Food & Groceries")
        db = _make_db([txn])
        result = find_similar_transaction("Woolworths", db)
        assert result is None


# ---------------------------------------------------------------------------
# categorize_with_llm — mocked httpx
# ---------------------------------------------------------------------------

def _llm_response(category: str):
    mock_response = MagicMock()
    mock_response.json.return_value = {"response": category}
    return mock_response


@pytest.mark.asyncio
class TestCategorizeWithLLM:
    async def test_returns_valid_category(self):
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=_llm_response("Food & Groceries")
            )
            result = await categorize_with_llm("Woolworths", 45.0, "supermarket context")
            assert result == "Food & Groceries"

    async def test_falls_back_to_other_for_unknown_category(self):
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=_llm_response("Some Random Category")
            )
            result = await categorize_with_llm("XYZ Corp", 10.0, "")
            assert result == "Other"

    async def test_returns_other_on_llm_error(self):
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=Exception("connection refused")
            )
            result = await categorize_with_llm("Any", 10.0, "")
            assert result == "Other"


# ---------------------------------------------------------------------------
# batch_categorise_with_llm — mocked httpx
# ---------------------------------------------------------------------------

def _batch_llm_response(mapping: dict):
    mock_response = MagicMock()
    mock_response.json.return_value = {"response": json.dumps(mapping)}
    return mock_response


@pytest.mark.asyncio
class TestBatchCategoriseWithLLM:
    async def test_happy_path(self):
        rows = [
            {"idx": 1, "merchant": "Woolworths", "amount": 80.0},
            {"idx": 2, "merchant": "Shell", "amount": 120.0},
        ]
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=_batch_llm_response({"1": "Food & Groceries", "2": "Transport"})
            )
            result = await batch_categorise_with_llm(rows)
            assert result["1"] == "Food & Groceries"
            assert result["2"] == "Transport"

    async def test_invalid_category_replaced_with_other(self):
        rows = [{"idx": 1, "merchant": "SomeCo", "amount": 10.0}]
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=_batch_llm_response({"1": "NotARealCategory"})
            )
            result = await batch_categorise_with_llm(rows)
            assert result["1"] == "Other"

    async def test_missing_row_filled_with_other(self):
        rows = [
            {"idx": 1, "merchant": "A", "amount": 10.0},
            {"idx": 2, "merchant": "B", "amount": 20.0},
        ]
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            # LLM only returns 1, misses 2
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=_batch_llm_response({"1": "Shopping"})
            )
            result = await batch_categorise_with_llm(rows)
            assert result["1"] == "Shopping"
            assert result["2"] == "Other"

    async def test_malformed_json_falls_back(self):
        rows = [{"idx": 1, "merchant": "A", "amount": 10.0}]
        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "not json at all"}

        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            # Fallback path calls categorize_with_llm per row
            with patch(
                "app.services.qwen_categoriser.categorize_with_llm",
                new=AsyncMock(return_value="Entertainment")
            ):
                result = await batch_categorise_with_llm(rows)
                assert result["1"] == "Entertainment"

    async def test_llm_exception_returns_other_for_all(self):
        rows = [{"idx": 1, "merchant": "X", "amount": 5.0}]
        with patch("app.services.qwen_categoriser.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=Exception("timeout")
            )
            result = await batch_categorise_with_llm(rows)
            assert result["1"] == "Other"


# ---------------------------------------------------------------------------
# categorise_transaction — orchestration logic
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestCategoriseTransaction:
    async def test_uses_db_match_when_found(self):
        db = MagicMock()
        with patch(
            "app.services.qwen_categoriser.find_similar_transaction",
            return_value="Transport"
        ):
            result = await categorise_transaction("Shell Petrol", 80.0, db)
            assert result == "Transport"

    async def test_falls_through_to_llm_when_no_db_match(self):
        db = MagicMock()
        with patch(
            "app.services.qwen_categoriser.find_similar_transaction",
            return_value=None
        ), patch(
            "app.services.qwen_categoriser.web_search_merchant",
            new=AsyncMock(return_value="petrol station context")
        ), patch(
            "app.services.qwen_categoriser.categorize_with_llm",
            new=AsyncMock(return_value="Transport")
        ):
            result = await categorise_transaction("NewPetrol XYZ", 60.0, db)
            assert result == "Transport"

    async def test_web_search_called_with_normalized_merchant(self):
        db = MagicMock()
        with patch(
            "app.services.qwen_categoriser.find_similar_transaction",
            return_value=None
        ), patch(
            "app.services.qwen_categoriser.web_search_merchant",
            new=AsyncMock(return_value="")
        ) as mock_search, patch(
            "app.services.qwen_categoriser.categorize_with_llm",
            new=AsyncMock(return_value="Other")
        ):
            await categorise_transaction("COLES PTY LTD AU", 50.0, db)
            called_with = mock_search.call_args[0][0]
            assert "pty" not in called_with
            assert "ltd" not in called_with
