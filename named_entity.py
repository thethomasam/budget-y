# pip install pandas spacy
# python -m spacy download en_core_web_sm

import json
import sys
from pathlib import Path

import pandas as pd
import spacy

# --- CONFIG ---
INPUT_CSV = "/home/sam/Desktop/Personal/budget-y/ANZ-6.csv"          # <- change to your file
OUTPUT_CSV = "output_with_ner.csv"
TEXT_COLUMNS = None              # e.g. ["title", "description"]; if None, auto-detect text-like columns
MAX_CHARS_PER_ROW = 100000       # safety cap for extremely long rows
# --------------

def pick_text_columns(df, max_unique_ratio=0.9):
    """Heuristic: choose object/string columns with mostly non-null, varied text."""
    text_cols = []
    for c in df.columns:
        if pd.api.types.is_string_dtype(df[c]) or df[c].dtype == object:
            # Ignore columns that look like IDs or have super low variety
            nunique = df[c].nunique(dropna=True)
            if nunique > 5 and nunique / max(1, len(df)) < max_unique_ratio:
                text_cols.append(c)
    return text_cols or [c for c in df.columns if pd.api.types.is_string_dtype(df[c])]

def concat_row_text(row, cols):
    parts = []
    for c in cols:
        val = row.get(c, "")
        if pd.notna(val):
            parts.append(str(val))
    text = " ".join(parts).strip()
    if len(text) > MAX_CHARS_PER_ROW:
        text = text[:MAX_CHARS_PER_ROW]
    return text

def extract_ner(text, nlp):
    if not text:
        return []
    doc = nlp(text)
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents]

def main():
    in_path = Path(INPUT_CSV)
    if not in_path.exists():
        print(f"CSV not found: {in_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(in_path)

    cols = TEXT_COLUMNS if TEXT_COLUMNS else pick_text_columns(df)
    if not cols:
        print("No text-like columns found. Set TEXT_COLUMNS explicitly.", file=sys.stderr)
        sys.exit(2)

    print(f"Using text columns: {cols}")

    # Load spaCy model
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        print("spaCy model 'en_core_web_sm' not found. Run:\n  python -m spacy download en_core_web_sm", file=sys.stderr)
        sys.exit(3)

    # Process rows
    named_entities = []
    for _, row in df.iterrows():
        text = concat_row_text(row, cols)
        ents = extract_ner(text, nlp)
        named_entities.append(json.dumps(ents, ensure_ascii=False))

    df["named_entities"] = named_entities

    # (Optional) quick tally columns
    def labels_only(ents_json):
        try:
            return [e["label"] for e in json.loads(ents_json)]
        except Exception:
            return []
    df["ner_labels"] = df["named_entities"].apply(labels_only)

    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Done. Saved: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
