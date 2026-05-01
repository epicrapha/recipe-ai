"""
API route definitions.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .database import (
    get_cluster_recipes,
    get_cluster_stats,
    get_random_recipes,
    get_recipe,
    get_recipes_by_ids,
    search_title,
)
from .engine import engine

router = APIRouter(prefix="/api")


# ── Request / Response models ──────────────────────────────────────

class RecommendRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1, description="List of ingredient strings")
    top_n: int = Field(default=20, ge=1, le=100)


class RecommendationItem(BaseModel):
    recipe_id: int
    score: float
    cluster: int
    recipe: dict | None = None


class RecommendResponse(BaseModel):
    recommendations: list[RecommendationItem]
    query_cluster: int


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {"status": "ok", "engine_loaded": engine._loaded}


@router.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest):
    """Recommend recipes based on input ingredients."""
    results = engine.recommend(body.ingredients, top_n=body.top_n)
    if not results:
        return RecommendResponse(recommendations=[], query_cluster=-1)

    # Enrich with recipe data
    ids = [r["recipe_id"] for r in results]
    recipes_map = {r["id"]: r for r in get_recipes_by_ids(ids)}

    items = []
    for r in results:
        items.append(
            RecommendationItem(
                recipe_id=r["recipe_id"],
                score=round(r["score"], 4),
                cluster=r["cluster"],
                recipe=recipes_map.get(r["recipe_id"]),
            )
        )

    return RecommendResponse(
        recommendations=items,
        query_cluster=results[0]["cluster"] if results else -1,
    )


@router.get("/recipe/{recipe_id}")
def recipe_detail(recipe_id: int):
    """Get a single recipe by ID."""
    recipe = get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Get similar recipes
    similar_raw = engine.get_similar(recipe_id, top_n=6)
    similar_ids = [s["recipe_id"] for s in similar_raw]
    similar_recipes = get_recipes_by_ids(similar_ids)

    similar = []
    for s, recipe_data in zip(similar_raw, similar_recipes):
        similar.append({**s, "recipe": recipe_data})

    return {"recipe": recipe, "similar": similar}


@router.get("/explore")
def explore(
    cluster: int = Query(0, ge=0),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Browse recipes by cluster with pagination."""
    return get_cluster_recipes(cluster, page, limit)


@router.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=100)):
    """Search recipes by title."""
    return {"results": search_title(q, limit)}


@router.get("/featured")
def featured():
    """Get random featured recipes and cluster stats."""
    return {
        "recipes": get_random_recipes(12),
        "clusters": get_cluster_stats(),
    }
