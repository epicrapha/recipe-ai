"""
One-time data preparation script.
Converts raw recipes_ui.csv + recipe_search_index.npy into production-ready formats:
  - SQLite database (recipes.db)
  - Compressed float16 search index (.npz)
"""

import csv
import os
import sqlite3
import time

import numpy as np


MODEL_DIR = os.environ.get(
    "MODEL_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "recipe_model"),
)
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", MODEL_DIR)

CSV_PATH = os.path.join(MODEL_DIR, "recipes_ui.csv")
INDEX_PATH = os.path.join(MODEL_DIR, "recipe_search_index.npy")
DB_PATH = os.path.join(OUTPUT_DIR, "recipes.db")
COMPRESSED_INDEX_PATH = os.path.join(OUTPUT_DIR, "search_index_f16.npz")


def create_database() -> None:
    if os.path.exists(DB_PATH):
        print(f"[skip] {DB_PATH} already exists. Delete it to regenerate.")
        return

    print(f"[info] Reading {CSV_PATH} ...")
    start = time.time()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS recipes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            ingredients TEXT    NOT NULL,
            directions  TEXT    NOT NULL,
            cluster     INTEGER NOT NULL DEFAULT 0
        );
        """
    )

    batch: list[tuple] = []
    count = 0

    with open(CSV_PATH, "r", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            batch.append((
                row["title"],
                row["ingredients"],
                row["directions"],
                int(row.get("cluster", 0)),
            ))
            count += 1
            if len(batch) >= 50_000:
                cur.executemany(
                    "INSERT INTO recipes (title, ingredients, directions, cluster) VALUES (?, ?, ?, ?)",
                    batch,
                )
                conn.commit()
                batch.clear()
                print(f"  ... {count:,} rows inserted")

    if batch:
        cur.executemany(
            "INSERT INTO recipes (title, ingredients, directions, cluster) VALUES (?, ?, ?, ?)",
            batch,
        )
        conn.commit()

    cur.execute("CREATE INDEX IF NOT EXISTS idx_cluster ON recipes(cluster);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_title ON recipes(title COLLATE NOCASE);")
    conn.commit()
    conn.close()

    elapsed = time.time() - start
    print(f"[done] Inserted {count:,} rows in {elapsed:.1f}s -> {DB_PATH}")


def compress_search_index() -> None:
    if os.path.exists(COMPRESSED_INDEX_PATH):
        print(f"[skip] {COMPRESSED_INDEX_PATH} already exists.")
        return

    print(f"[info] Loading {INDEX_PATH} ...")
    data = np.load(INDEX_PATH, mmap_mode="r")
    print(f"  shape: {data.shape}  dtype: {data.dtype}")

    data_f16 = data.astype(np.float16)
    np.savez_compressed(COMPRESSED_INDEX_PATH, index=data_f16)

    orig = os.path.getsize(INDEX_PATH)
    comp = os.path.getsize(COMPRESSED_INDEX_PATH)
    print(f"[done] {orig / 1e6:.0f} MB -> {comp / 1e6:.0f} MB ({comp / orig * 100:.1f}%)")


if __name__ == "__main__":
    create_database()
    compress_search_index()
    print("\nData preparation complete.")
