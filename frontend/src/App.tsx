import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { HomePage } from "@/pages/HomePage";
import { ResultsPage } from "@/pages/ResultsPage";
import { RecipePage } from "@/pages/RecipePage";
import { ExplorePage } from "@/pages/ExplorePage";
import { SearchPage } from "@/pages/SearchPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/30 py-8 mt-12 bg-muted/5">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-medium text-foreground/80">
            RecipeAI — K-Means Clustered Recipe Recommendation Engine
          </p>
          <p className="text-xs text-muted-foreground">
            Raphael Plaza, Aldwin Estopia, Michael Ramos
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/recipe/:id" element={<RecipePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
