import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeGrid } from "@/components/RecipeGrid";
import { api, CLUSTER_META } from "@/lib/api";

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cluster = Number(searchParams.get("cluster") ?? 0);
  const page = Number(searchParams.get("page") ?? 1);

  const { data, isLoading } = useQuery({
    queryKey: ["explore", cluster, page],
    queryFn: () => api.explore(cluster, page, 24),
    staleTime: 60 * 1000,
  });

  const setCluster = (c: string) => {
    setSearchParams({ cluster: c, page: "1" });
  };

  const setPage = (p: number) => {
    setSearchParams({ cluster: String(cluster), page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gridItems = (data?.recipes ?? []).map((r) => ({ recipe: r }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Explore Recipes</h1>
        <p className="text-muted-foreground">Browse {data?.total?.toLocaleString() ?? "…"} recipes by category</p>
      </div>

      {/* Cluster tabs */}
      <Tabs value={String(cluster)} onValueChange={setCluster}>
        <TabsList className="bg-secondary/50">
          {Object.entries(CLUSTER_META).map(([id, meta]) => (
            <TabsTrigger key={id} value={id} className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <span className="mr-1.5">{meta.icon}</span>
              {meta.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid */}
      <RecipeGrid recipes={gridItems} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="border-border/50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {data.total_pages.toLocaleString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= data.total_pages}
            className="border-border/50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
