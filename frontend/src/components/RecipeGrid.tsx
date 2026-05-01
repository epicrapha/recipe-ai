import { RecipeCard } from "@/components/RecipeCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recipe } from "@/lib/api";

interface RecipeGridProps {
  recipes: { recipe: Recipe | null; score?: number }[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function RecipeGrid({ recipes, isLoading, emptyMessage = "No recipes found." }: RecipeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-muted" />
            <Skeleton className="h-5 w-20 bg-muted rounded-full" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-3 w-24 bg-muted" />
              <Skeleton className="h-3 w-16 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const validRecipes = recipes.filter((r) => r.recipe !== null);

  if (validRecipes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {validRecipes.map((item) => (
        <RecipeCard
          key={item.recipe!.id}
          recipe={item.recipe!}
          score={item.score}
        />
      ))}
    </div>
  );
}
