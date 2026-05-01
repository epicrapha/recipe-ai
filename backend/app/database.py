"""
Async SQLite database layer for recipe queries.
"""

import ast
import json
import os
import sqlite3
from typing import Optional

MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "recipe_model"))
DB_PATH = os.path.join(MODEL_DIR, "recipes.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _parse_list_field(raw: str) -> list[str]:
    """Parse a stringified Python list into an actual list."""
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, list):
            return parsed
    except (ValueError, SyntaxError):
        pass
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        pass
    return [raw]


def _row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["ingredients"] = _parse_list_field(d.get("ingredients", "[]"))
    d["directions"] = _parse_list_field(d.get("directions", "[]"))
    return d


def get_recipe(recipe_id: int) -> Optional[dict]:
    conn = _get_conn()
    cur = conn.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return _row_to_dict(row)


def get_recipes_by_ids(ids: list[int]) -> list[dict]:
    if not ids:
        return []
    conn = _get_conn()
    placeholders = ",".join("?" for _ in ids)
    cur = conn.execute(f"SELECT * FROM recipes WHERE id IN ({placeholders})", ids)
    rows = cur.fetchall()
    conn.close()
    # Preserve order
    by_id = {_row_to_dict(r)["id"]: _row_to_dict(r) for r in rows}
    return [by_id[i] for i in ids if i in by_id]


def get_cluster_recipes(cluster: int, page: int = 1, limit: int = 20) -> dict:
    conn = _get_conn()
    offset = (page - 1) * limit

    cur = conn.execute("SELECT COUNT(*) as cnt FROM recipes WHERE cluster = ?", (cluster,))
    total = cur.fetchone()["cnt"]

    cur = conn.execute(
        "SELECT * FROM recipes WHERE cluster = ? LIMIT ? OFFSET ?",
        (cluster, limit, offset),
    )
    rows = [_row_to_dict(r) for r in cur.fetchall()]
    conn.close()

    return {
        "recipes": rows,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


def search_title(query: str, limit: int = 20) -> list[dict]:
    conn = _get_conn()
    cur = conn.execute(
        "SELECT * FROM recipes WHERE title LIKE ? LIMIT ?",
        (f"%{query}%", limit),
    )
    rows = [_row_to_dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_random_recipes(limit: int = 12) -> list[dict]:
    conn = _get_conn()
    cur = conn.execute("SELECT * FROM recipes ORDER BY RANDOM() LIMIT ?", (limit,))
    rows = [_row_to_dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_cluster_stats() -> list[dict]:
    conn = _get_conn()
    cur = conn.execute(
        "SELECT cluster, COUNT(*) as count FROM recipes GROUP BY cluster ORDER BY cluster"
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows
