import * as React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { imdbSearch } from "@/lib/client/cineforum/proposals";
import type { ImdbSuggestionDTO } from "@/lib/shared/types";

export default function MovieSearch({
  onResults,
}: {
  onResults: (items: ImdbSuggestionDTO[]) => void;
}) {
  const { t } = useTranslation("proposal");
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
        placeholder={t("create.searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      <Button onClick={search} disabled={loading}>
        {loading ? t("create.searching") : t("create.searchButton")}
      </Button>
    </div>
  );
}
