const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────

export interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  directions: string[];
  cluster: number;
}

export interface RecommendationItem {
  recipe_id: number;
  score: number;
  cluster: number;
  recipe: Recipe | null;
}

export interface RecommendResponse {
  recommendations: RecommendationItem[];
  query_cluster: number;
}

export interface PaginatedRecipes {
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface FeaturedResponse {
  recipes: Recipe[];
  clusters: { cluster: number; count: number }[];
}

export interface RecipeDetailResponse {
  recipe: Recipe;
  similar: (RecommendationItem & { recipe: Recipe })[];
}

// ── Cluster metadata ──────────────────────────────────────────────

export const CLUSTER_META: Record<number, { label: string; color: string; icon: string }> = {
  0: { label: "Baked & Sweet", color: "saffron", icon: "🍰" },
  1: { label: "Savory & Main", color: "ocean", icon: "🍲" },
};

// ── API client ────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error ${res.status}`);
  }

  return res.json();
}

export const api = {
  recommend(ingredients: string[], topN = 20): Promise<RecommendResponse> {
    return request("/api/recommend", {
      method: "POST",
      body: JSON.stringify({ ingredients, top_n: topN }),
    });
  },

  getRecipe(id: number): Promise<RecipeDetailResponse> {
    return request(`/api/recipe/${id}`);
  },

  explore(cluster: number, page = 1, limit = 20): Promise<PaginatedRecipes> {
    return request(`/api/explore?cluster=${cluster}&page=${page}&limit=${limit}`);
  },

  search(query: string, limit = 20): Promise<{ results: Recipe[] }> {
    return request(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  featured(): Promise<FeaturedResponse> {
    return request("/api/featured");
  },
};
