import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecipeGrid } from "@/components/RecipeGrid";
import { ClusterBadge } from "@/components/ClusterBadge";
import { api } from "@/lib/api";

export function ResultsPage() {
  const [searchParams] = useSearchParams();
  const ingredientsRaw = searchParams.get("ingredients") || "";

  const ingredients = useMemo(
    () => ingredientsRaw.split(",").map((s) => s.trim()).filter(Boolean),
    [ingredientsRaw]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["recommend", ingredients],
    queryFn: () => api.recommend(ingredients),
    enabled: ingredients.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const gridItems = useMemo(
    () =>
      data?.recommendations?.map((r) => ({
        recipe: r.recipe,
        score: r.score,
      })) ?? [],
    [data]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Recommendations</h1>

          {/* Input ingredients */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">For:</span>
            {ingredients.map((ing) => (
              <Badge key={ing} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {ing}
              </Badge>
            ))}
          </div>

          {/* Cluster result */}
          {data && data.query_cluster >= 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Predicted category:
              <ClusterBadge cluster={data.query_cluster} />
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-destructive font-medium">Failed to fetch recommendations</p>
          <p className="text-sm text-muted-foreground mt-1">
            Make sure the backend is running at {import.meta.env.VITE_API_URL || "http://localhost:8000"}
          </p>
        </div>
      )}

      {/* Results count */}
      {data && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Found {data.recommendations.length} matching recipes
        </p>
      )}

      {/* Grid */}
      <RecipeGrid
        recipes={gridItems}
        isLoading={isLoading}
        emptyMessage="No recipes match those ingredients. Try different ones."
      />
    </div>
  );
}
