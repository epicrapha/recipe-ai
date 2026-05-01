import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, ChefHat, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IngredientInput } from "@/components/IngredientInput";
import { RecipeCard } from "@/components/RecipeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api, CLUSTER_META } from "@/lib/api";

export function HomePage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: () => api.featured(),
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = () => {
    if (ingredients.length > 0) {
      navigate(`/results?ingredients=${encodeURIComponent(ingredients.join(","))}`);
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="relative pt-16 sm:pt-24 pb-8">
        <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Powered by K-Means Clustering + Word2Vec
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Find recipes from{" "}
            <span className="text-gradient">ingredients you have</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Enter what's in your kitchen. Our AI matches your ingredients against 2M+ recipes
            using semantic similarity to find the perfect dish.
          </p>

          {/* Ingredient input */}
          <div className="max-w-2xl mx-auto pt-4">
            <IngredientInput
              value={ingredients}
              onChange={setIngredients}
              placeholder="chicken, garlic, olive oil…"
            />

            <Button
              onClick={handleSearch}
              disabled={ingredients.length === 0}
              size="lg"
              className="mt-4 w-full sm:w-auto px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-saffron transition-all disabled:opacity-40"
            >
              Find Recipes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ChefHat, label: "Recipes Indexed", value: "2.2M+" },
            { icon: Zap, label: "Word2Vec Dimensions", value: "100D" },
            { icon: Target, label: "Clustering Accuracy", value: "92.7%" },
          ].map((stat) => (
            <Card key={stat.label} className="glass border-border/30">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cluster categories */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(CLUSTER_META).map(([clusterId, meta]) => {
            const count = featured?.clusters?.find(
              (c) => c.cluster === Number(clusterId)
            )?.count;

            return (
              <Card
                key={clusterId}
                className="glass border-border/30 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => navigate(`/explore?cluster=${clusterId}`)}
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="text-4xl">{meta.icon}</div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {meta.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {count ? `${count.toLocaleString()} recipes` : "Loading…"}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Featured recipes */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Discover Recipes</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/explore")} className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-muted" />
                <Skeleton className="h-5 w-20 bg-muted rounded-full" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featured?.recipes?.slice(0, 8).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
