import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { imdbSearch } from "@/lib/client/cineforum/proposals";
import type { ImdbMovieData } from "@/lib/shared/types/cineforum";

type Props = {
  onMovieAdd: (movie: ImdbMovieData) => void;
};

/** Inline movie search panel used inside the proposal edit form. */
export default function ProposalMovieSearch({ onMovieAdd }: Props) {
  const { t } = useTranslation("admin");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImdbMovieData[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query || query.length < 2) return;
    setSearching(true);
    try {
      const found = await imdbSearch(query);
      setResults(found);
    } catch (err) {
      console.error("Movie search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (movie: ImdbMovieData) => {
    onMovieAdd(movie);
    setResults([]);
    setQuery("");
  };

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder={t("proposals.searchMoviePlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {results.length > 0 && (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleAdd(movie)}
                className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent"
              >
                {movie.i?.[0] && (
                  <img
                    src={movie.i[0]}
                    alt={movie.l}
                    className="h-12 w-8 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {movie.l} {movie.y && `(${movie.y})`}
                  </p>
                  {movie.s && (
                    <p className="truncate text-xs text-muted-foreground">
                      {movie.s}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
