"""
Transaction categorization using TF-IDF and cosine similarity.
"""
import re
import os
import joblib
from typing import Dict, List, Optional
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Category keywords for TF-IDF matching
CATEGORY_KEYWORDS = {
    "Groceries": ["aldi", "coles", "woolworths", "iga", "foodland"],
    "Transport & Travel": ["upark", "uber", "taxi", "lyft", "bolt", "ola", "bus", "train", "metro", "parking"],
    "Dining & Food": ["culinary", "bottega", "bakery", "cafe", "chatkazz", "jonny", "munooshi", "zambrero",
                      "restaurant", "club", "bar", "uber eats", "delight", "homeboy", "grill", "pizza",
                      "bistro", "kebab", "takeaway", "brew", "chaioz"],
    "Shopping & Retail": ["jb", "laundret", "officeworks", "uniqlo", "target", "kmart", "jb hifi", "myer",
                          "david jones", "rebel", "big w", "amazon", "ebay", "temu"],
    "Auto & Fuel": ["united", "fuel", "petrol", "bp", "caltex", "shell", "7-eleven", "ampol", "car wash"],
    "Entertainment & Subscriptions": ["netflix", "spotify", "apple", "itunes", "subscription", "youtube",
                                      "disney", "paramount", "stan", "binge"],
    "Banking & Transfers": ["transfer", "payment", "deposit", "atm", "withdrawal", "refund", "interest", "fee", "charge"],
    "Utilities & Bills": ["energy", "water", "electricity", "gas", "agl", "origin", "synergy", "sa power",
                          "telstra", "optus", "vodafone", "internet", "mobile", "nbn", "lebara"],
    "Insurance & Healthcare": ["insurance", "bupa", "medibank", "nib", "allianz", "health fund", "cover",
                               "unihealth", "chemist", "policy"],
    "Education & Learning": ["university", "school", "edu", "course", "tutor", "training", "udemy", "coursera"],
    "Donations & Charity": ["charity", "donation", "ngo", "foundation", "appeal"],
    "Government & Fees": ["gov", "tax", "ato", "council", "license", "registration", "fine", "toll"],
    "Medical & Pharmacy": ["pharmacy", "chemist", "medical", "clinic", "doctor", "hospital"],
    "Travel & Accommodation": ["hotel", "airbnb", "booking", "flight", "qantas", "jetstar", "virgin", "trip", "expedia"],
    "Health & Fitness": ["gym", "fitness", "anytime fitness", "snap fitness", "pilates", "yoga", "f45"],
    "Home & Hardware": ["hardware", "bunnings", "ikea", "home improvement", "paint", "garden", "plumbing"],
    "Other": []
}


class TransactionCategorizer:
    """
    Categorizes transactions using TF-IDF vectorization and cosine similarity.
    """

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the categorizer with a TF-IDF model.

        Args:
            model_path: Path to the saved TF-IDF vectorizer pickle file.
                       If None, uses TFIDF_MODEL_PATH env var or defaults to "tfidf_vectorizer.pkl"
        """
        if model_path is None:
            model_path = os.getenv("TFIDF_MODEL_PATH", "tfidf_vectorizer.pkl")
        self.model_path = model_path
        self.vectorizer = None
        self.category_names = list(CATEGORY_KEYWORDS.keys())
        self.category_texts = [" ".join(words) for words in CATEGORY_KEYWORDS.values()]
        self.category_vectors = None

        self._load_model()

    def _load_model(self) -> bool:
        """
        Load the TF-IDF vectorizer from disk.

        Returns:
            True if model loaded successfully, False otherwise
        """
        if not os.path.exists(self.model_path):
            print(f"⚠️ TF-IDF model not found at {self.model_path}")
            return False

        try:
            self.vectorizer = joblib.load(self.model_path)
            # Pre-compute category vectors for efficiency
            self.category_vectors = self.vectorizer.transform(self.category_texts)
            print("✅ TF-IDF model loaded successfully")
            return True
        except Exception as e:
            print(f"⚠️ Failed to load TF-IDF model: {e}")
            return False

    @staticmethod
    def normalize_text(text: str) -> str:
        """
        Normalize transaction text for TF-IDF processing.

        Args:
            text: Raw transaction text

        Returns:
            Normalized text (lowercase, alphanumeric only)
        """
        text = str(text).lower()
        text = re.sub(r"[^a-z0-9 ]+", " ", text)
        return text.strip()

    def categorize(self, transaction_text: str) -> Dict[str, any]:
        """
        Categorize a single transaction using TF-IDF and cosine similarity.

        Args:
            transaction_text: The transaction description text

        Returns:
            Dict with 'category' and 'confidence' keys
        """
        if not self.vectorizer:
            return {"category": "Other", "confidence": 0.0}

        # Normalize the transaction text
        normalized_text = self.normalize_text(transaction_text)

        # Transform the transaction text
        txn_vector = self.vectorizer.transform([normalized_text])

        # Compute cosine similarity with all categories
        similarities = cosine_similarity(txn_vector, self.category_vectors)
        best_idx = similarities.argmax()
        best_score = similarities[0, best_idx]

        # Get the predicted category
        predicted_category = self.category_names[best_idx]

        return {
            "category": predicted_category,
            "confidence": float(best_score)
        }

    def categorize_batch(self, transaction_texts: List[str]) -> List[Dict[str, any]]:
        """
        Categorize multiple transactions at once.

        Args:
            transaction_texts: List of transaction description texts

        Returns:
            List of dicts with 'category' and 'confidence' keys
        """
        if not self.vectorizer:
            return [{"category": "Other", "confidence": 0.0} for _ in transaction_texts]

        # Normalize all texts
        normalized_texts = [self.normalize_text(text) for text in transaction_texts]

        # Transform all texts at once (more efficient)
        txn_vectors = self.vectorizer.transform(normalized_texts)

        # Compute similarities for all transactions
        similarities = cosine_similarity(txn_vectors, self.category_vectors)

        # Get best category for each transaction
        results = []
        for i in range(len(transaction_texts)):
            best_idx = similarities[i].argmax()
            best_score = similarities[i, best_idx]
            results.append({
                "category": self.category_names[best_idx],
                "confidence": float(best_score)
            })

        return results

    def is_loaded(self) -> bool:
        """Check if the TF-IDF model is loaded."""
        return self.vectorizer is not None
