import * as React from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Plus,
  Search,
  Sparkles,
  Film,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import MovieSearch from "./MovieSearch";
import MovieCard from "./MovieCard";
import SelectedMovies from "./SelectedMovies";
import { createProposal, fetchProposalWinners } from "@/lib/client/cineforum";

/** Create Proposal block (IMDb search + simple selection + submit) */
export default function CreateProposal({
  cineforumId,
}: {
  cineforumId: string;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation("proposal");

  const [results, setResults] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [owner, setOwner] = React.useState<{
    id: string;
    type: "User" | "Team";
  } | null>(null);
  const [creating, setCreating] = React.useState(false);

  // Set of IMDb IDs that have already won a previous proposal
  const [previousWinnerImdbIds, setPreviousWinnerImdbIds] = React.useState<
    Set<string>
  >(new Set());

  React.useEffect(() => {
    if (session?.user && "id" in session.user && session.user.id) {
      setOwner({ id: session.user.id as string, type: "User" });
    }
  }, [session]);

  // Fetch previous winners once on mount
  React.useEffect(() => {
    fetchProposalWinners(cineforumId)
      .then((data) => setPreviousWinnerImdbIds(new Set(data.imdbIds)))
      .catch(() => {
        // Non-critical: silently ignore if the fetch fails
      });
  }, [cineforumId]);

  function toggleMovie(m: any) {
    const isAlreadySelected = selected.some((x) => x.id === m.id);

    if (isAlreadySelected) {
      setSelected((prev) => prev.filter((x) => x.id !== m.id));
    } else {
      setSelected((prev) => [...prev, m]);
      setResults([]);
    }
  }

  async function submitCreate() {
    if (!owner || !title || !description || !date || selected.length === 0) {
      alert(t("create.alertFillFields"));
      return;
    }
    setCreating(true);
    try {
      await createProposal({
        cineforumId,
        date,
        candidate: owner,
        title,
        description,
        proposal: selected,
      });
      location.reload();
    } catch {
      alert(t("create.alertCreationFailed"));
    } finally {
      setCreating(false);
    }
  }

  const isFormValid =
    owner && title && description && date && selected.length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Intro header */}
      <div className="cine-card cine-glass relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="cine-badge animate-scale-in">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("create.badge")}
            </div>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            {t("create.title")}{" "}
            <span className="text-gradient">{t("create.titleHighlight")}</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {t("create.subtitle")}
          </p>
        </div>
      </div>

      {/* Main form card */}
      <Card className="cine-card border-primary/20 animate-fade-in-up delay-100">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span>{t("create.cardTitle")}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Date and Title */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                {t("create.screeningDate")}
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="cine-input h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                {t("create.proposalTitle")}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("create.proposalTitlePlaceholder")}
                className="cine-input h-11"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Film className="h-4 w-4 text-primary" />
              {t("create.description")}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("create.descriptionPlaceholder")}
              className="cine-input min-h-25 resize-y"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {t("create.descriptionHint")}
            </p>
          </div>

          {/* Movie Search Section */}
          <div className="cine-card p-5 bg-muted/30 border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm md:text-base font-semibold">
                <Search className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                {t("create.searchTitle")}
              </Label>
              {selected.length > 0 && (
                <div className="cine-badge bg-primary/30 text-primary animate-scale-in">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {t("create.selectedCount", { count: selected.length })}
                </div>
              )}
            </div>

            <MovieSearch onResults={setResults} />

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-muted-foreground font-medium">
                  {t("create.searchResults")}
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
                  {results.map((m) => {
                    const isSelected = selected.some((x) => x.id === m.id);
                    const isPreviousWinner = previousWinnerImdbIds.has(m.id);
                    return (
                      <MovieCard
                        key={m.id}
                        movie={m}
                        isSelected={isSelected}
                        isPreviousWinner={isPreviousWinner}
                        onToggle={toggleMovie}
                        variant="search"
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Movies Display */}
          <SelectedMovies
            items={selected}
            onRemove={toggleMovie}
            previousWinnerIds={previousWinnerImdbIds}
          />

          {/* Validation Message */}
          {!isFormValid &&
            (selected.length > 0 || title || description || date) && (
              <div className="cine-card p-3 bg-destructive/10 border-destructive/30 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive/90">
                    {t("create.validationError")}
                  </p>
                </div>
              </div>
            )}

          {/* Submit Section */}
          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("create.readyTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("create.readySubtitle")}
              </p>
            </div>

            <Button
              onClick={submitCreate}
              disabled={creating || !isFormValid}
              className="cine-btn h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("create.creating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {t("create.createButton")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
