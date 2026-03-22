"""
One-time script to build course embeddings from availablecourses.db.

Usage:
    cd backend && uv run python tools/build_embeddings.py
"""

import os
import pickle
import sqlite3

import numpy as np
from sentence_transformers import SentenceTransformer

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "availablecourses.db")
EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "course_embeddings.npy")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "..", "course_metadata.pkl")
MODEL_NAME = "all-MiniLM-L6-v2"


def build():
    # 1. Read all courses from SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT course_code, name, section, crn, time, professor, credits, description FROM courses"
    ).fetchall()
    conn.close()

    courses = [dict(row) for row in rows]
    print(f"Loaded {len(courses)} courses from database")

    # 2. Build text documents for embedding
    documents = []
    for c in courses:
        doc = (
            f"{c['course_code']}: {c['name']}. "
            f"{c['credits']} credits. "
            f"Professor: {c['professor']}. "
            f"{c['description'] or ''}"
        )
        documents.append(doc)

    # 3. Embed with sentence-transformers
    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print("Encoding documents...")
    embeddings = model.encode(documents, show_progress_bar=True, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype=np.float32)
    print(f"Embeddings shape: {embeddings.shape}")

    # 4. Save artifacts
    np.save(EMBEDDINGS_PATH, embeddings)
    print(f"Saved embeddings to {EMBEDDINGS_PATH}")

    with open(METADATA_PATH, "wb") as f:
        pickle.dump(courses, f)
    print(f"Saved metadata to {METADATA_PATH}")


if __name__ == "__main__":
    build()
