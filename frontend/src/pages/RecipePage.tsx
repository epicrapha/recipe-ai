import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChefHat, Clock, ListOrdered, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ClusterBadge } from "@/components/ClusterBadge";
import { RecipeCard } from "@/components/RecipeCard";
import { api } from "@/lib/api";

export function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);

  const { data, isLoading, error } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => api.getRecipe(recipeId),
    enabled: !isNaN(recipeId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-12 w-3/4 bg-muted" />
        <Skeleton className="h-6 w-32 bg-muted rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-destructive text-lg font-medium">Recipe not found</p>
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go home
          </Link>
        </Button>
      </div>
    );
  }

  const { recipe, similar } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Link>
      </Button>

      {/* Title section */}
      <div className="space-y-4">
        <ClusterBadge cluster={recipe.cluster} />
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{recipe.title}</h1>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-4 w-4" />
            {recipe.ingredients?.length ?? 0} ingredients
          </span>
          <span className="flex items-center gap-1.5">
            <ListOrdered className="h-4 w-4" />
            {recipe.directions?.length ?? 0} steps
          </span>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Ingredients — left column */}
        <Card className="glass border-border/30 lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Ingredients
            </h2>
            <Separator className="bg-border/50" />
            <ul className="space-y-2.5">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-foreground/90">{ing}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Directions — right column */}
        <Card className="glass border-border/30 lg:col-span-3">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Directions
            </h2>
            <Separator className="bg-border/50" />
            <ol className="space-y-5">
              {recipe.directions?.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/90 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Similar recipes */}
      {similar && similar.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Similar Recipes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.map((s) => (
              <RecipeCard key={s.recipe_id} recipe={s.recipe} score={s.score} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
