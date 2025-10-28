"""
Simple test script for the transaction categorizer
"""
from categorizer import TransactionCategorizer

def test_categorizer():
    print("Initializing categorizer...")
    categorizer = TransactionCategorizer()

    if not categorizer.is_loaded():
        print("❌ Categorizer failed to load. Make sure tfidf_vectorizer.pkl exists.")
        return

    print("✅ Categorizer loaded successfully!\n")

    # Test transactions
    test_transactions = [
        "Coles supermarket groceries",
        "Uber ride from airport",
        "Netflix monthly subscription",
        "ALDI STORES PROSPECT",
        "CHATKAZZ LIGHTSVIEW",
        "JB HI FI ADELAIDE",
        "UNITED RICHMOND",
        "WOOLWORTHS/7 GRASSMERE RD",
    ]

    print("Testing single transaction categorization:")
    print("-" * 60)
    for txn in test_transactions[:3]:
        result = categorizer.categorize(txn)
        print(f"Transaction: {txn}")
        print(f"  Category: {result['category']}")
        print(f"  Confidence: {result['confidence']:.4f}\n")

    print("\nTesting batch categorization:")
    print("-" * 60)
    results = categorizer.categorize_batch(test_transactions[3:])
    for txn, result in zip(test_transactions[3:], results):
        print(f"{txn:40s} -> {result['category']:25s} ({result['confidence']:.4f})")

    print("\n✅ All tests completed!")

if __name__ == "__main__":
    test_categorizer()
