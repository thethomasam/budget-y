import difflib

import httpx
from ddgs import DDGS
from ddgs.exceptions import DDGSException
from sqlalchemy.orm import Session

from config import OLLAMA_MODEL, OLLAMA_URL
from location_trie import MerchantCleaner
from models import Category, Transaction

_cleaner = MerchantCleaner.default()


def _match_similar_merchant(merchant: str, db: Session) -> Category | None:
    """Reuse the category of a previously-seen, similarly-named merchant."""
    categorized = db.query(Transaction).filter(Transaction.category_id.isnot(None)).all()
    by_merchant = {t.merchant.strip(): t.category for t in categorized}
    by_cleaned = {
        _cleaner.clean(name)[0].lower(): name for name in by_merchant
    }
    business_name, _location = _cleaner.clean(merchant)
    matches = difflib.get_close_matches(
        business_name.lower(), by_cleaned.keys(), n=1, cutoff=0.8
    )
    return by_merchant[by_cleaned[matches[0]]] if matches else None


def _search_merchant(merchant: str, location: str | None) -> str:
    """Web-search the merchant (DuckDuckGo via ddgs) for a short description, for LLM context."""
    query = f"{merchant} {location}" if location else f"{merchant} Australia"
    try:
        results = DDGS().text(query, max_results=1)
    except DDGSException:
        return ""
    return results[0]["body"] if results else ""


def _ask_llm(merchant: str, snippet: str, categories: list[str]) -> str | None:
    """Ask the local Ollama model to pick the best matching category, if any."""
    if not categories:
        return None

    category_list = ", ".join(categories) + ", none"
    prompt = (
        "You are a bank-transaction categorizer. Given a merchant and a category list, "
        "reply with exactly one category from the list that best matches the merchant's "
        "business, or 'none' if you are not confident any of them fit. Reply with only "
        "the category name, nothing else.\n\n"
        f"Merchant: {merchant}\nAbout: {snippet or 'unknown'}\nCategories: {category_list}\nAnswer:"
    )
    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0},
            },
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        return None

    answer = response.json().get("response", "").strip().splitlines()[0].strip(" .").lower()
    exact = next((c for c in categories if c.lower() == answer), None)
    if exact is not None:
        return exact
    # tolerate singular/plural mismatches (e.g. "groceries" vs "grocery")
    return next((c for c in categories if c.lower().rstrip("s") == answer.rstrip("s")), None)


def categorize_merchant(merchant: str, db: Session) -> Category | None:
    """Find a category for a merchant: reuse a similar past merchant's category,
    otherwise search the web for the merchant and ask the local LLM to pick one."""
    match = _match_similar_merchant(merchant, db)
    if match is not None:
        return match

    categories = [row[0] for row in db.query(Category.name).all()]
    business_name, location = _cleaner.clean(merchant)
    snippet = _search_merchant(business_name, location)
    name = _ask_llm(merchant, snippet, categories)
    if name is None:
        print("not found")
        return None
    return db.query(Category).filter(Category.name == name).first()
