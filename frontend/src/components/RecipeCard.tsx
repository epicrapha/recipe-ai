import { Link } from "react-router-dom";
import { Clock, ChefHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClusterBadge } from "@/components/ClusterBadge";
import type { Recipe } from "@/lib/api";

interface RecipeCardProps {
  recipe: Recipe;
  score?: number;
  className?: string;
}

export function RecipeCard({ recipe, score, className = "" }: RecipeCardProps) {
  const ingredientCount = recipe.ingredients?.length ?? 0;
  const stepCount = recipe.directions?.length ?? 0;

  return (
    <Link to={`/recipe/${recipe.id}`}>
      <Card
        className={`group glass border-border/50 hover:border-primary/30 transition-all duration-300 hover:glow-saffron hover:-translate-y-1 cursor-pointer overflow-hidden ${className}`}
      >
        <CardContent className="p-5 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {recipe.title}
            </h3>
            {score !== undefined && (
              <span className="text-xs font-mono text-primary bg-primary/10 rounded-md px-2 py-1 shrink-0">
                {Math.round(score * 100)}%
              </span>
            )}
          </div>

          {/* Cluster badge */}
          <ClusterBadge cluster={recipe.cluster} />

          {/* Ingredients preview */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Ingredients
            </p>
            <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
              {recipe.ingredients?.slice(0, 4).join(" · ")}
              {ingredientCount > 4 && ` +${ingredientCount - 4} more`}
            </p>
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5" />
              {ingredientCount} ingredients
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {stepCount} steps
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
