import re
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression

# 1) Load your CSV
df = pd.read_csv("/home/sam/Desktop/Personal/budget-y/ANZ-6.csv", header=None)
df.columns = ["Date", "Amount", "Details"]
df["Details"] = df["Details"].astype(str)

# Extract a clean text field for modeling
def normalize(row):
    text = row["Details"]
    text = re.sub(r"\s+", " ", text).strip()
    return text

df["text"] = df.apply(normalize, axis=1)

# 2) Weak labels (replace with your curated labels when ready)
def weak_label(t):
    t = str(t).lower()

    if any(k in t for k in ["aldi", "coles", "woolworths", "iga", "foodland"]):
        return "Groceries"
    if any(k in t for k in ["upark","uber", "taxi", "lyft", "bolt", "ola", "bus", "train", "metro", "parking"]):
        return "Transport & Travel"
    if any(k in t for k in ["culinary","bottega","bakery","cafe","chatkazz", "jonny", "munooshi", "zambrero", "restaurant", "club", "bar", "uber eats", "delight", "homeboy", "grill", "pizza", "bistro", "kebab", "takeaway", "brew" ,"chaioz"]):
        return "Dining & Food"
    if any(k in t for k in ["jb","laundret","officeworks", "uniqlo", "target", "kmart", "jb hifi", "myer", "david jones", "rebel", "big w", "amazon", "ebay", "temu"]):
        return "Shopping & Retail"
    if any(k in t for k in ["united","fuel", "petrol", "bp", "caltex", "shell", "7-eleven", "ampol", "car wash"]):
        return "Auto & Fuel"
    if any(k in t for k in ["netflix", "spotify", "apple", "itunes", "subscription", "youtube", "disney", "paramount", "stan", "binge"]):
        return "Entertainment & Subscriptions"
    if any(k in t for k in ["transfer", "payment", "deposit", "atm", "withdrawal", "refund", "interest", "fee", "charge"]):
        return "Banking & Transfers"
    if any(k in t for k in ["energy", "water", "electricity", "gas", "agl", "origin", "synergy", "sa power", "telstra", "optus", "vodafone", "internet", "mobile", "nbn", "lebara"]):
        return "Utilities & Bills"
    if any(k in t for k in ["insurance", "bupa", "medibank", "nib", "allianz", "health fund", "cover","unihealth", "chemist","policy"]):
        return "Insurance & Healthcare"
    if any(k in t for k in ["university", "school", "edu", "course", "tutor", "training", "udemy", "coursera"]):
        return "Education & Learning"
    if any(k in t for k in ["charity", "donation", "ngo", "foundation", "appeal"]):
        return "Donations & Charity"
    if any(k in t for k in ["gov", "tax", "ato", "council", "license", "registration", "fine", "toll"]):
        return "Government & Fees"
    if any(k in t for k in ["pharmacy", "chemist", "medical", "clinic", "doctor", "hospital"]):
        return "Medical & Pharmacy"
    if any(k in t for k in ["hotel", "airbnb", "booking", "flight", "qantas", "jetstar", "virgin", "trip", "expedia"]):
        return "Travel & Accommodation"
    if any(k in t for k in ["gym", "fitness", "anytime fitness", "snap fitness", "pilates", "yoga", "f45"]):
        return "Health & Fitness"
    if any(k in t for k in ["hardware", "bunnings", "ikea", "home improvement", "paint", "garden", "plumbing"]):
        return "Home & Hardware"

    return "Other"

df["label"] = df["text"].apply(weak_label).fillna("Other")

# # Merge rare labels into "Other" to ensure each class has at least 2 samples for stratify
min_per_class = 2
vc = df["label"].value_counts()
rare_labels = vc[vc < min_per_class].index
df["label"] = np.where(df["label"].isin(rare_labels), "Other", df["label"])

# Recompute counts after merge and decide stratification safely
vc_post = df["label"].value_counts()
use_stratify = vc_post.min() >= 2

print("Label counts after merge:\n", vc_post)

# Single, safe split (no duplicate second split)
X_train, X_test, y_train, y_test = train_test_split(
    df["text"],
    df["label"],
    test_size=0.25,
    stratify=df["label"] if use_stratify else None,
    random_state=42
)

# 3) Embeddings + classifier
embedder = SentenceTransformer("all-MiniLM-L6-v2")
X_train_emb = embedder.encode(X_train.tolist(), show_progress_bar=True)
X_test_emb  = embedder.encode(X_test.tolist(), show_progress_bar=True)

clf = LogisticRegression(max_iter=200, class_weight="balanced")  # helps with small / imbalanced data
clf.fit(X_train_emb, y_train)

pred = clf.predict(X_test_emb)
print(classification_report(y_test, pred))

from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

cm = confusion_matrix(y_test, pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm)
disp.plot(cmap='Blues', xticks_rotation=45).save()
df.to_csv("sample-2.csv")