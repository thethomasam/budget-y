import pandas as pd
from sentence_transformers import SentenceTransformer, util

# Load data
file_path = "ANZ-6.csv"
df = pd.read_csv(file_path, header=None, names=["Date", "Amount", "Details"])

# Extract Description and Location
df["Details"] = df["Details"].astype(str)
df["Description"] = df["Details"].apply(lambda x: " ".join(x.split()[:-1]))
df["Location"] = df["Details"].apply(lambda x: x.split()[-1])

# Load MiniLM
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Define semantic categories
categories = [
    "Groceries",
    "Dining & Food",
    "Transport",
    "Shopping",
    "Health & Pharmacy",
    "Travel & Auto",
    "Banking & Transfers",
    "Other"
]
cat_embeddings = embedder.encode(categories, convert_to_tensor=True)

# Function to find closest semantic category
def semantic_category(desc):
    emb = embedder.encode(desc, convert_to_tensor=True)
    sim = util.cos_sim(emb, cat_embeddings)[0]
    return categories[int(sim.argmax())]

# Apply categorization
df["Category"] = df["Description"].apply(semantic_category)

# Save annotated file
df.to_csv("annotated_ANZ.csv", index=False)
print(df.head(20))
