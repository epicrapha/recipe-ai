import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChefHat, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <ChefHat className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-semibold text-lg hidden sm:block">
            Recipe<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes…"
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:ring-primary/30 h-9 text-sm"
            />
          </div>
        </form>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/explore">
              <Compass className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Explore</span>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
