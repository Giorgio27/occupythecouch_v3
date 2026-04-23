import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import {
  ProposalDetailDTO,
  ImdbMovieData,
  ProposalRankingDTO,
} from "@/lib/shared/types/cineforum";
import {
  adminProposalsClient,
  MovieUpdateData,
} from "@/lib/client/cineforum/admin-proposals";
import { imdbSearch, fetchRanking } from "@/lib/client/cineforum/proposals";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpandableText } from "@/components/ui/expandable-text";
import {
  Calendar,
  Film,
  Trash2,
  Plus,
  Search,
  Trophy,
  Sparkles,
  ChevronDown,
  History,
} from "lucide-react";

interface AdminProposalsPageProps {
  cineforumId: string;
  cineforumName: string;
  currentProposal: ProposalDetailDTO | null;
}

export default function AdminProposalsPage({
  cineforumId,
  cineforumName,
  currentProposal: initialProposal,
}: AdminProposalsPageProps) {
  const { t } = useTranslation("admin");
  const { isAdmin, isLoading: isLoadingAccess } = useAdminAccess(cineforumId);

  const [proposal, setProposal] = useState<ProposalDetailDTO | null>(
    initialProposal,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editMovies, setEditMovies] = useState<MovieUpdateData[]>([]);

  // Movie search state
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [movieSearchResults, setMovieSearchResults] = useState<ImdbMovieData[]>(
    [],
  );
  const [searchingMovies, setSearchingMovies] = useState(false);

  // Ranking state
  const [ranking, setRanking] = useState<ProposalRankingDTO | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const loadRanking = async (proposalId: string) => {
    if (ranking || loadingRanking) return;
    setLoadingRanking(true);
    try {
      const r = await fetchRanking(proposalId);
      setRanking(r);
    } catch (err) {
      console.error("Failed to load ranking", err);
    } finally {
      setLoadingRanking(false);
    }
  };

  const handleOpenCloseDialog = () => {
    setShowCloseDialog(true);
    setSelectedWinnerId(null);
  };

  const handleCloseProposal = async () => {
    if (!proposal || !cineforumId || !selectedWinnerId) return;
    setLoading(true);
    setError(null);
    try {
      const closed = await adminProposalsClient.closeProposal(
        cineforumId,
        proposal.id,
        selectedWinnerId,
      );
      setProposal(closed);
      setShowCloseDialog(false);
      setSelectedWinnerId(null);
    } catch (err) {
      setError(t("proposals.closeError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenProposal = async () => {
    if (!proposal || !cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const reopened = await adminProposalsClient.reopenProposal(
        cineforumId,
        proposal.id,
      );
      setProposal(reopened);
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : null) ??
          t("proposals.reopenError"),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResults = async () => {
    if (!proposal || !cineforumId) return;
    if (isEditing) cancelEditing();
    setLoading(true);
    setError(null);
    try {
      const updated = await adminProposalsClient.updateProposal(
        cineforumId,
        proposal.id,
        { show_results: !proposal.show_results },
      );
      setProposal(updated);
    } catch (err) {
      setError(t("proposals.updateError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!proposal) return;
    setIsEditing(true);
    setEditDate(
      proposal.date ? new Date(proposal.date).toISOString().split("T")[0] : "",
    );
    setEditMovies(
      proposal.movies.map((m) => ({
        id: m.id,
        l: m.title,
        y: m.year,
        title: m.title,
        year: m.year,
        imageMedium: m.imageMedium,
        image: m.image,
        i: [m.imageMedium, m.image],
      })),
    );
    setShowMovieSearch(false);
    setMovieSearchQuery("");
    setMovieSearchResults([]);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditDate("");
    setEditMovies([]);
    setShowMovieSearch(false);
    setMovieSearchQuery("");
    setMovieSearchResults([]);
  };

  const saveEditing = async () => {
    if (!proposal || !cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await adminProposalsClient.updateProposal(
        cineforumId,
        proposal.id,
        { date: editDate || null, movies: editMovies },
      );
      setProposal(updated);
      cancelEditing();
    } catch (err) {
      setError(t("proposals.updateError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeMovie = (movieId: string) => {
    setEditMovies((prev) => prev.filter((m) => m.id !== movieId));
  };

  const searchMovies = async () => {
    if (!movieSearchQuery || movieSearchQuery.length < 2) return;
    setSearchingMovies(true);
    try {
      const results = await imdbSearch(movieSearchQuery);
      setMovieSearchResults(results);
    } catch (err) {
      console.error("Movie search failed", err);
    } finally {
      setSearchingMovies(false);
    }
  };

  const addMovieFromSearch = (movie: ImdbMovieData) => {
    if (editMovies.some((m) => m.id === movie.id)) return;
    setEditMovies((prev) => [...prev, movie]);
    setMovieSearchResults([]);
    setMovieSearchQuery("");
  };

  if (isLoadingAccess) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          {t("proposals.loading") || t("rounds.loading")}
        </div>
      </CineforumLayout>
    );
  }

  if (!isAdmin) return null;

  const displayMovies = isEditing ? editMovies : (proposal?.movies ?? []);
  const displayDate = isEditing ? editDate : proposal?.date;
  const canReopen = proposal?.closed && !proposal?.roundClosed;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("proposals.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("proposals.pageSubtitle")}
            </p>
          </div>
          <Link
            href={`/cineforum/${cineforumId}/rankings/proposals`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("proposals.historyLink")}
            </span>
          </Link>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* No proposal */}
        {!proposal ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("proposals.noProposal")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-card">
            {/* Proposal header bar */}
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{proposal.title}</span>
                {proposal.round && (
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground">
                    {proposal.round}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {displayDate
                    ? new Date(displayDate).toLocaleDateString()
                    : t("proposals.noDate")}
                </span>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    proposal.closed
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border border-amber-100 bg-amber-50 text-amber-700"
                  }`}
                >
                  {proposal.closed
                    ? t("proposals.statusClosed")
                    : t("proposals.statusOpen")}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* Description */}
              {proposal.description && (
                <div className="rounded-md border bg-muted/50 p-3">
                  <ExpandableText text={proposal.description} maxLength={150} />
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t("proposals.dateLabel")}
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  <p className="text-sm">
                    {displayDate
                      ? new Date(displayDate).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : t("proposals.noDateSet")}
                  </p>
                )}
              </div>

              {/* Movies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t("proposals.moviesCount", {
                      count: displayMovies.length,
                    })}
                  </Label>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMovieSearch(!showMovieSearch)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t("proposals.addMovie")}
                    </Button>
                  )}
                </div>

                {/* Movie Search */}
                {isEditing && showMovieSearch && (
                  <Card className="p-3">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("proposals.searchMoviePlaceholder")}
                          value={movieSearchQuery}
                          onChange={(e) => setMovieSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchMovies()}
                        />
                        <Button
                          onClick={searchMovies}
                          disabled={searchingMovies}
                          size="sm"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      {movieSearchResults.length > 0 && (
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                          {movieSearchResults.map((movie) => (
                            <button
                              key={movie.id}
                              onClick={() => addMovieFromSearch(movie)}
                              className="flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-accent"
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
                )}

                {/* Movie list */}
                <div className="space-y-2">
                  {displayMovies.map((movie) => {
                    const movieImage = movie.imageMedium || movie.i?.[0];
                    const movieTitle = movie.title || movie.l;
                    const movieYear = movie.year || movie.y;

                    const rankedMovie =
                      !isEditing && ranking
                        ? ranking.sorted_movies.find((m) => m.id === movie.id)
                        : null;
                    const isWinner = rankedMovie?.proposal_rank === 1;
                    const winnersCount = ranking
                      ? ranking.sorted_movies.filter(
                          (m) => m.proposal_rank === 1,
                        ).length
                      : 0;
                    const isTiedWinner = isWinner && winnersCount > 1;

                    return (
                      <div
                        key={movie.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 ${
                          isWinner
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/70 bg-card/60"
                        }`}
                      >
                        {movieImage ? (
                          <img
                            src={movieImage}
                            alt={movieTitle}
                            className="h-24 w-16 flex-shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-16 flex-shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              {!isEditing && isWinner && (
                                <p className="mb-1 text-xs font-semibold text-primary">
                                  {isTiedWinner
                                    ? t("proposals.winnerTied", {
                                        count: winnersCount - 1,
                                      })
                                    : t("proposals.winner")}
                                </p>
                              )}
                              <p
                                className="truncate font-semibold"
                                title={movieTitle}
                              >
                                {movieTitle}
                              </p>
                              {movieYear && (
                                <p className="text-sm text-muted-foreground">
                                  {movieYear}
                                </p>
                              )}
                            </div>
                            {!isEditing && isWinner && (
                              <Trophy className="h-5 w-5 flex-shrink-0 text-primary" />
                            )}
                          </div>
                          {!isEditing && rankedMovie && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs">
                              <span className="font-semibold">
                                {t("proposals.ranksLabel")}
                              </span>
                              <span className="text-primary">
                                {rankedMovie.proposal_rank}
                              </span>
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMovie(movie.id)}
                            className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voting Results */}
              {!isEditing && proposal.votes && proposal.votes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t("proposals.votingResults", {
                      count: proposal.votes.length,
                    })}
                  </Label>
                  <details className="rounded-lg border border-border/70 bg-card/50 p-3">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">
                            {t("proposals.individualVotes")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({proposal.votes.length})
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </summary>
                    <div className="mt-3 space-y-2">
                      {proposal.votes.map((vote) => (
                        <div
                          key={vote.id}
                          className="rounded-md border border-border/70 bg-secondary/20 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {vote.user.name ||
                                `User ${vote.user.id.slice(0, 8)}`}
                            </div>
                            <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground">
                              {Object.keys(vote.movie_selection).length} ranks
                            </span>
                          </div>
                          <div className="space-y-2">
                            {Object.keys(vote.movie_selection)
                              .sort((a, b) => parseInt(a) - parseInt(b))
                              .map((rank) => {
                                const movieIds = vote.movie_selection[
                                  rank
                                ] as string[];
                                const movieTitles = movieIds
                                  .map(
                                    (id) =>
                                      proposal.movies.find((m) => m.id === id)
                                        ?.title,
                                  )
                                  .filter(Boolean);
                                return (
                                  <div
                                    key={rank}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                      {rank}°
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {movieTitles.map((title, i) => (
                                        <div
                                          key={i}
                                          className="rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5 text-xs"
                                        >
                                          {title}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("proposals.ownerLabel")}
                  </span>
                  <span className="font-medium">
                    {proposal.owner?.type} –{" "}
                    {proposal.owner?.name ?? proposal.owner?.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("proposals.resultsLabel")}
                  </span>
                  <span className="font-medium">
                    {proposal.show_results
                      ? t("proposals.resultsVisible")
                      : t("proposals.resultsHidden")}
                  </span>
                </div>
                {proposal.winner && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("proposals.winnerLabel")}
                    </span>
                    <span className="font-medium">{proposal.winner.title}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={saveEditing}
                      disabled={loading || editMovies.length === 0}
                      size="sm"
                    >
                      {t("proposals.saveChanges")}
                    </Button>
                    <Button
                      onClick={cancelEditing}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      {t("proposals.cancel")}
                    </Button>
                  </>
                ) : (
                  <TooltipProvider>
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={
                              proposal.closed ||
                              (proposal.votes && proposal.votes.length > 0)
                                ? "cursor-not-allowed"
                                : ""
                            }
                          >
                            <Button
                              onClick={startEditing}
                              disabled={
                                loading ||
                                proposal.closed ||
                                (proposal.votes && proposal.votes.length > 0)
                              }
                              variant="outline"
                              size="sm"
                            >
                              {t("proposals.edit")}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {proposal.closed
                            ? t("proposals.cannotEdit")
                            : proposal.votes && proposal.votes.length > 0
                              ? t("proposals.cannotEditWithVotes")
                              : t("proposals.edit")}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={
                              proposal.closed ? "cursor-not-allowed" : ""
                            }
                          >
                            <Button
                              onClick={handleOpenCloseDialog}
                              disabled={loading || proposal.closed}
                              variant={proposal.closed ? "outline" : "default"}
                              size="sm"
                            >
                              {t("proposals.close")}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {proposal.closed
                            ? t("proposals.statusClosed")
                            : t("proposals.closeDialogTitle")}
                        </TooltipContent>
                      </Tooltip>

                      {canReopen && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleReopenProposal}
                              disabled={loading}
                              variant="outline"
                              size="sm"
                            >
                              {t("proposals.reopen")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("proposals.reopen")}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {!proposal.closed && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleToggleResults}
                              disabled={loading}
                              variant={
                                proposal.show_results ? "secondary" : "outline"
                              }
                              size="sm"
                            >
                              {t("proposals.toggleResults")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("proposals.toggleResults")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Close Proposal Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("proposals.closeDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("proposals.selectWinner")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {proposal?.movies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => setSelectedWinnerId(movie.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                    selectedWinnerId === movie.id
                      ? "border-primary bg-accent"
                      : "border-border"
                  }`}
                >
                  {movie.imageMedium && (
                    <img
                      src={movie.imageMedium}
                      alt={movie.title}
                      className="h-16 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {movie.year}
                    </p>
                  </div>
                  {selectedWinnerId === movie.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                disabled={loading}
              >
                {t("proposals.cancel")}
              </Button>
              <Button
                onClick={handleCloseProposal}
                disabled={loading || !selectedWinnerId}
              >
                {loading
                  ? t("proposals.closing")
                  : t("proposals.closeDialogTitle")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cineforumProps = await getCineforumLayoutProps(context);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  const { cineforumId } = cineforumProps.props as {
    cineforumId: string;
    cineforumName: string;
  };
  const session = await getServerSession(context.req, context.res, authOptions);

  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    return {
      redirect: {
        destination: `/cineforum/${cineforumId}`,
        permanent: false,
      },
    };
  }

  // Fetch the most recent proposal (open first, otherwise last closed)
  const proposal = await prisma.proposal.findFirst({
    where: { cineforumId },
    orderBy: [{ closed: "asc" }, { date: "desc" }],
    include: {
      movies: { include: { movie: true } },
      round: true,
      ownerUser: true,
      ownerTeam: true,
      winner: true,
      votes: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const currentProposal = proposal
    ? {
        id: proposal.id,
        date: proposal.date?.toISOString() || null,
        title: proposal.title,
        description: proposal.description,
        closed: proposal.closed,
        show_results: proposal.showResults,
        round: proposal.round?.name || null,
        roundId: proposal.roundId,
        roundClosed: proposal.round?.closed || false,
        winner: proposal.winner
          ? {
              id: proposal.winner.id,
              title: proposal.winner.title,
              year: proposal.winner.year,
              image: proposal.winner.image,
            }
          : null,
        owner: proposal.ownerUserId
          ? {
              id: proposal.ownerUserId,
              type: "User" as const,
              name: proposal.ownerUser?.name || null,
            }
          : {
              id: proposal.ownerTeamId!,
              type: "Team" as const,
              name: proposal.ownerTeam?.name || null,
            },
        movies: proposal.movies.map((pm) => ({
          id: pm.movie.id,
          title: pm.movie.title,
          year: pm.movie.year,
          image: pm.movie.image,
          imageMedium: pm.movie.imageMedium,
        })),
        votes: proposal.votes.map((v) => ({
          id: v.id,
          user: { id: v.user.id, name: v.user.name },
          movie_selection: v.movieSelection as Record<string, string[]>,
        })),
        created_at: proposal.createdAt.toISOString(),
        missing_users: [],
        no_votes_left: false,
      }
    : null;

  return {
    props: {
      ...cineforumProps.props,
      currentProposal,
    },
  };
};
