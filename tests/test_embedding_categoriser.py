"""
Quick proof-of-concept: can sentence embeddings categorise merchants
by similarity to category names alone — no training data needed?

Install:
    pip install sentence-transformers

Run:
    python tests/test_embedding_categoriser.py
"""
import numpy as np
from sentence_transformers import SentenceTransformer

CATEGORIES = [
    "Food & Groceries",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Health & Wellness",
    "Travel",
    "Other",
]

TEST_MERCHANTS = [
    ("Woolworths", "Food & Groceries"),
    ("Coles", "Food & Groceries"),
    ("Uber Eats", "Food & Groceries"),
    ("Shell Petrol", "Transport"),
    ("Uber", "Transport"),
    ("Netflix", "Entertainment"),
    ("Spotify", "Entertainment"),
    ("JB Hi-Fi", "Shopping"),
    ("Chemist Warehouse", "Health & Wellness"),
    ("Qantas", "Travel"),
    ("AGL Energy", "Bills & Utilities"),
    ("Sydney Water", "Bills & Utilities"),
    ("Bunnings", "Shopping"),
    ("Airbnb", "Travel"),
    ("McDonald's", "Food & Groceries"),
]


def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def predict(merchant: str, category_embeddings: np.ndarray, model) -> tuple[str, float]:
    emb = model.encode(merchant)
    sims = [cosine_sim(emb, ce) for ce in category_embeddings]
    best_idx = int(np.argmax(sims))
    return CATEGORIES[best_idx], float(sims[best_idx])


def main():
    print("Loading model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print("Embedding categories...")
    category_embeddings = model.encode(CATEGORIES)

    print(f"\n{'Merchant':<25} {'Expected':<22} {'Predicted':<22} {'Sim':>5}  {'OK'}")
    print("-" * 85)

    correct = 0
    for merchant, expected in TEST_MERCHANTS:
        predicted, sim = predict(merchant, category_embeddings, model)
        ok = predicted == expected
        if ok:
            correct += 1
        flag = "✓" if ok else "✗"
        print(f"{merchant:<25} {expected:<22} {predicted:<22} {sim:.3f}  {flag}")

    print(f"\nAccuracy: {correct}/{len(TEST_MERCHANTS)} ({correct/len(TEST_MERCHANTS)*100:.0f}%)")


main()
