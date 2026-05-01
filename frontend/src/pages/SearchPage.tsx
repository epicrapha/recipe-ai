import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/RecipeGrid";
import { api } from "@/lib/api";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query, 40),
    enabled: query.length > 0,
    staleTime: 60 * 1000,
  });

  const gridItems = useMemo(
    () => (data?.results ?? []).map((r) => ({ recipe: r })),
    [data]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">
            Results for "<span className="text-primary">{query}</span>"
          </h1>
        </div>

        {data && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Found {data.results.length} recipes
          </p>
        )}
      </div>

      <RecipeGrid
        recipes={gridItems}
        isLoading={isLoading}
        emptyMessage={`No recipes found for "${query}".`}
      />
    </div>
  );
}
