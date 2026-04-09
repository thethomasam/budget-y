import os
import re
import json
import asyncio
import yaml
import httpx
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Transaction

config_path = Path(__file__).parent.parent.parent / "config.yaml"
with open(config_path) as f:
    config = yaml.safe_load(f)

CATEGORIES = [g["name"] for g in config["budget_goals"]]
LLM_CONFIG = config["llm"]
SEARCH_CONFIG = config["search"]
SIMILARITY_THRESHOLD = config["categoriser"]["similarity_threshold"]


def normalize_transaction(text: str) -> str:
    text = text.lower()
    for word in ['pty', 'ltd', 'inc', 'llc', 'corp', 'au', 'aus', 'australia']:
        text = re.sub(rf'\b{word}\b', '', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return ' '.join(text.split())


def find_similar_transaction(merchant: str, db: Session) -> Optional[str]:
    normalized = normalize_transaction(merchant)
    first_word = normalized.split()[0] if normalized else ""

    for txn in db.query(Transaction).filter(
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).all():
        if not txn.merchant:
            continue
        norm_db = normalize_transaction(txn.merchant)
        if SequenceMatcher(None, normalized, norm_db).ratio() >= SIMILARITY_THRESHOLD:
            print(f"Fuzzy match: '{normalized}' ~ '{norm_db}'")
            return txn.category
        if first_word and len(first_word) > 3 and norm_db.startswith(first_word):
            print(f"First-word match: '{normalized}' ~ '{norm_db}'")
            return txn.category

    return None


async def web_search_merchant(merchant: str) -> str:
    """Search web for merchant context using Tavily."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": os.getenv("TAVILY_API_KEY"),
                    "query": f"{merchant} business type category Australia",
                    "max_results": SEARCH_CONFIG["max_results"],
                },
                timeout=SEARCH_CONFIG["timeout"],
            )
            results = response.json().get("results", [])
            if results:
                print(f"Search OK: '{merchant}' — {len(results)} result(s)")
                return "\n".join(f"{r['title']}: {r['content'][:200]}" for r in results)
            else:
                print(f"Search OK: '{merchant}' — no results")
                return ""
    except Exception as e:
        print(f"Search FAILED: '{merchant}' — {e}")
        return ""


async def batch_categorise_with_llm(rows: list) -> dict:
    """Categorise a batch of transactions with web search context per merchant.
    rows: [{"idx": int, "merchant": str, "amount": float}, ...]
    returns: {"1": "Food & Groceries", ...}
    """
    # Search all merchants concurrently
    contexts = await asyncio.gather(*[web_search_merchant(r["merchant"]) for r in rows])

    lines = "\n".join(
        f"{r['idx']}. {r['merchant']} | ${r['amount']}"
        + (f"\n   Context: {ctx[:300]}" if ctx else "")
        for r, ctx in zip(rows, contexts)
    )

    prompt = f"""Categorize each transaction into ONE of: {', '.join(CATEGORIES)}

{lines}

Return ONLY valid JSON: {{"1": "Category", "2": "Category"}}"""

    try:
        async with httpx.AsyncClient(timeout=LLM_CONFIG["timeout"]) as client:
            response = await client.post(
                LLM_CONFIG["url"],
                json={"model": LLM_CONFIG["model"], "prompt": prompt, "stream": False, "think": LLM_CONFIG["think"]}
            )
            raw = response.json()["response"]
            cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
            match = re.search(r'\{[^{}]*\}', cleaned, re.DOTALL)
            result = json.loads(match.group()) if match else {}
            out = {k: (v if v in CATEGORIES else "Other") for k, v in result.items()}
            for r in rows:
                out.setdefault(str(r["idx"]), "Other")
            print(f"LLM OK (batch {len(rows)}): {out}")
            return out
    except Exception as e:
        print(f"LLM FAILED (batch): {e}")
        return {str(r["idx"]): "Other" for r in rows}


async def categorise_transaction(merchant: str, amount: float, db: Session) -> str:
    """Categorise a single transaction: DB match first, then web search + LLM."""
    category = find_similar_transaction(merchant, db)
    if category:
        return category

    normalized = normalize_transaction(merchant)
    context = await web_search_merchant(normalized)

    prompt = f"""Categorize this transaction into ONE of: {', '.join(CATEGORIES)}

Merchant: {normalized}
Amount: ${amount}
Context: {context[:500]}

Return ONLY the category name."""

    try:
        async with httpx.AsyncClient(timeout=LLM_CONFIG["timeout"]) as client:
            response = await client.post(
                LLM_CONFIG["url"],
                json={"model": LLM_CONFIG["model"], "prompt": prompt, "stream": False, "think": LLM_CONFIG["think"]}
            )
            raw = response.json()["response"]
            cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
            category = cleaned if cleaned in CATEGORIES else "Other"
            print(f"LLM OK (single): '{merchant}' → {category}")
            return category
    except Exception as e:
        print(f"LLM FAILED (single): '{merchant}' — {e}")
        return "Other"
