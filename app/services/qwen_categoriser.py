import os
import re
import time
import yaml
import httpx
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Transaction


# Load config
config_path = Path(__file__).parent.parent.parent / "config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

CATEGORIES = config["categories"]
LLM_CONFIG = config["llm"]
SEARCH_CONFIG = config["search"]


def normalize_transaction(transaction: str) -> str:
    """Normalize transaction text by removing noise and standardizing format."""
    text = transaction.lower()

    # Remove common noise words
    noise_words = ['pty', 'ltd', 'inc', 'llc', 'corp', 'au', 'aus', 'australia']
    for word in noise_words:
        text = re.sub(rf'\b{word}\b', '', text)

    # Remove special characters except spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text.strip()


async def web_search_merchant(merchant: str) -> str:
    """Search web for merchant info using Tavily API."""
    start_time = time.time()
    api_key = os.getenv("TAVILY_API_KEY")
    normalized_merchant = normalize_transaction(merchant)
    query = f"{normalized_merchant} business type category"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "max_results": SEARCH_CONFIG["max_results"]
            },
            timeout=SEARCH_CONFIG["timeout"]
        )
        data = response.json()
        results = data.get("results", [])
        context = "\n".join([f"{r['title']}: {r['content']}" for r in results])

        duration = time.time() - start_time
        print(f"Search time: {duration:.2f}s")

        return context or "No search results found."


async def categorize_with_llm(merchant: str, amount: float, search_context: str) -> str:
    """Call Ollama to categorize transaction using search context."""
    start_time = time.time()
    prompt = f"""Categorize this transaction into ONE category: {', '.join(CATEGORIES)}

Web search context:
{search_context[:500]}

Transaction:
Merchant: {merchant}
Amount: ${amount}

Return ONLY the category name."""

    try:
        async with httpx.AsyncClient(timeout=LLM_CONFIG["timeout"]) as client:
            response = await client.post(
                LLM_CONFIG["url"],
                json={
                    "model": LLM_CONFIG["model"],
                    "prompt": prompt,
                    "stream": False,
                    "think": LLM_CONFIG["think"]
                }
            )
            result = response.json()
            duration = time.time() - start_time
            print(f"LLM time: {duration:.2f}s")
            print(f"Response: {result}")
            category = result["response"].strip()

            return category if category in CATEGORIES else "Other"
    except Exception as e:
        duration = time.time() - start_time
        print(f"LLM time: {duration:.2f}s (failed)")
        print(f"LLM Error: {e}")
        return "Other"

def find_similar_transaction(merchant: str, db: Session) -> Optional[str]:
    """Find similar transaction in DB and return category."""
    normalized_merchant = normalize_transaction(merchant)

    # Search for transactions with similar merchant names
    transactions = db.query(Transaction).filter(
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).all()
    for txn in transactions:
        if txn.merchant:
            normalized_db = normalize_transaction(txn.merchant)
            if normalized_merchant == normalized_db:
                return txn.category
   
    return None

async def categorise_transaction(merchant: str, amount: float, db: Session) -> str:
    """Categorize transaction by checking DB first, then using LLM if needed."""

    # Check DB for similar transactions
    known_category = find_similar_transaction(merchant, db)
    if known_category:
        return known_category
    # If not found or low confidence, use web search + LLM
    print("No similar transaction found, using web search + LLM")
    search_context = await web_search_merchant(merchant)
    category = await categorize_with_llm(merchant, amount, search_context)

    return category


