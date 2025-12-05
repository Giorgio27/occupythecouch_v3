import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { imdbSearch } from "@/lib/client/cineforum/proposals";

export default function MovieSearch({
  onResults,
}: {
  onResults: (items: any[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function search() {
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const data = await imdbSearch(query);
      onResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Type a title"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      <Button onClick={search} disabled={loading}>
        {loading ? "Searching…" : "Search"}
      </Button>
    </div>
  );
}
