import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import CineforumLayout from "@/components/CineforumLayout";
import {
  ProposalDetailDTO,
  ProposalsListResponseDTO,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExpandableText } from "@/components/ui/expandable-text";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  Calendar,
  Film,
  Trash2,
  Plus,
  Search,
  Trophy,
  Medal,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";

interface AdminProposalsPageProps {
  cineforumId: string;
  cineforumName: string;
  initialData: ProposalsListResponseDTO;
}

export default function AdminProposalsPage({
  cineforumId,
  cineforumName,
  initialData,
}: AdminProposalsPageProps) {
  const { isAdmin, isLoading: isLoadingAccess } = useAdminAccess(cineforumId);

  const [proposals, setProposals] = useState<ProposalDetailDTO[]>(
    initialData.proposals,
  );
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] =
    useState<ProposalDetailDTO | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Edit state
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  );
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
  const [rankings, setRankings] = useState<Record<string, ProposalRankingDTO>>(
    {},
  );
  const [loadingRankings, setLoadingRankings] = useState<
    Record<string, boolean>
  >({});

  // Group proposals by round
  const proposalsByRound = useMemo(() => {
    const grouped = new Map<string, ProposalDetailDTO[]>();

    proposals.forEach((proposal) => {
      const roundKey = proposal.round || "No Round";
      if (!grouped.has(roundKey)) {
        grouped.set(roundKey, []);
      }
      grouped.get(roundKey)!.push(proposal);
    });

    const groupedArray = Array.from(grouped.entries()).map(
      ([round, items]) => ({
        round,
        proposals: items,
      }),
    );

    return groupedArray;
  }, [proposals]);

  // Check if a round is the last (most recent) round
  const isLastRound = (roundIndex: number) => roundIndex === 0;

  // Load ranking for first proposal of each round (the ones that open by default)
  useEffect(() => {
    proposalsByRound.forEach((group) => {
      const firstProposal = group.proposals[0];
      if (
        firstProposal &&
        firstProposal.votes &&
        firstProposal.votes.length > 0
      ) {
        loadRanking(firstProposal.id);
      }
    });
  }, [proposalsByRound]);

  const handleLoadMore = async () => {
    if (!cineforumId || loading || !pagination.hasMore) return;

    setLoading(true);
    setError(null);
    try {
      const nextPage = pagination.page + 1;
      const data = await adminProposalsClient.getAllProposals(
        cineforumId as string,
        nextPage,
        pagination.limit,
      );
      setProposals((prev) => [...prev, ...data.proposals]);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to load more proposals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloseDialog = (proposal: ProposalDetailDTO) => {
    setSelectedProposal(proposal);
    setShowCloseDialog(true);
    setSelectedWinnerId(null);
  };

  const handleCloseProposal = async () => {
    if (!selectedProposal || !cineforumId || !selectedWinnerId) return;

    setLoading(true);
    setError(null);
    try {
      const closedProposal = await adminProposalsClient.closeProposal(
        cineforumId as string,
        selectedProposal.id,
        selectedWinnerId,
      );

      setProposals((prev) =>
        prev.map((p) => (p.id === closedProposal.id ? closedProposal : p)),
      );

      setShowCloseDialog(false);
      setSelectedProposal(null);
      setSelectedWinnerId(null);
    } catch (err) {
      setError("Failed to close proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenProposal = async (proposal: ProposalDetailDTO) => {
    if (!cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const reopenedProposal = await adminProposalsClient.reopenProposal(
        cineforumId as string,
        proposal.id,
      );

      setProposals((prev) =>
        prev.map((p) => (p.id === reopenedProposal.id ? reopenedProposal : p)),
      );
    } catch (err: any) {
      setError(err.message || "Failed to reopen proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResults = async (proposal: ProposalDetailDTO) => {
    if (!cineforumId) return;

    // Reset editing state before updating
    if (editingProposalId === proposal.id) {
      cancelEditing();
    }

    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await adminProposalsClient.updateProposal(
        cineforumId as string,
        proposal.id,
        { show_results: !proposal.show_results },
      );

      setProposals((prev) =>
        prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p)),
      );
    } catch (err) {
      setError("Failed to update proposal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const startEditing = (proposal: ProposalDetailDTO) => {
    setEditingProposalId(proposal.id);
    setEditDate(
      proposal.date ? new Date(proposal.date).toISOString().split("T")[0] : "",
    );
    // Store movies with their full data for editing
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
    setEditingProposalId(null);
    setEditDate("");
    setEditMovies([]);
    setShowMovieSearch(false);
    setMovieSearchQuery("");
    setMovieSearchResults([]);
  };

  const saveEditing = async (proposalId: string) => {
    if (!cineforumId) return;

    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await adminProposalsClient.updateProposal(
        cineforumId as string,
        proposalId,
        {
          date: editDate || null,
          movies: editMovies,
        },
      );

      setProposals((prev) =>
        prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p)),
      );

      cancelEditing();
    } catch (err) {
      setError("Failed to update proposal");
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
    // Check if movie already exists
    if (editMovies.some((m) => m.id === movie.id)) {
      return;
    }

    // Add movie to edit list with full IMDb data
    setEditMovies((prev) => [...prev, movie]);
    setMovieSearchResults([]);
    setMovieSearchQuery("");
  };

  const loadRanking = async (proposalId: string) => {
    if (rankings[proposalId] || loadingRankings[proposalId]) return;

    setLoadingRankings((prev) => ({ ...prev, [proposalId]: true }));
    try {
      const ranking = await fetchRanking(proposalId);
      setRankings((prev) => ({ ...prev, [proposalId]: ranking }));
    } catch (err) {
      console.error("Failed to load ranking", err);
    } finally {
      setLoadingRankings((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  if (isLoadingAccess) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      </CineforumLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            All Proposals
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all proposals for this cineforum, grouped by oscar/round.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Proposals grouped by round with infinite scroll */}
        {proposals.length > 0 ? (
          <InfiniteScroll
            items={proposalsByRound}
            hasMore={pagination.hasMore}
            isLoading={loading}
            onLoadMore={handleLoadMore}
            className="space-y-8"
            renderItem={(group, groupIndex) => (
              <div key={`${group.round}-${groupIndex}`} className="space-y-4">
                {/* Round header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {group.round}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Proposals in accordion */}
                <Accordion
                  type="single"
                  collapsible
                  className="space-y-2"
                  defaultValue={group.proposals[0]?.id}
                >
                  {group.proposals.map((proposal, proposalIndex) => {
                    const isEditing = editingProposalId === proposal.id;
                    console.log(
                      "Proposal",
                      proposal.title,
                      "round closed?",
                      proposal.roundClosed,
                      "isEditing?",
                      isEditing,
                      "propsals.votes",
                      proposal.votes,
                    );
                    const displayMovies = isEditing
                      ? editMovies
                      : proposal.movies;
                    const displayDate = isEditing ? editDate : proposal.date;

                    // Check if this is the last (most recent) proposal in the round
                    const isLastProposalInRound = proposalIndex === 0;
                    // Check if this round is the last round
                    const isThisLastRound = isLastRound(groupIndex);
                    // Check if round is still open (using roundClosed field)
                    const isRoundOpen = !proposal.roundClosed;
                    // Show reopen button only if: proposal is closed, it's the last proposal, it's the last round, and round is open
                    const canReopen =
                      proposal.closed &&
                      isLastProposalInRound &&
                      isThisLastRound &&
                      isRoundOpen;

                    return (
                      <AccordionItem
                        key={proposal.id}
                        value={proposal.id}
                        className="rounded-lg border bg-card"
                      >
                        <AccordionTrigger
                          className="px-4 hover:no-underline"
                          onClick={() => loadRanking(proposal.id)}
                        >
                          <div className="flex w-full items-center justify-between gap-4 pr-2">
                            <div className="flex items-center gap-3">
                              <Film className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {proposal.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                {displayDate
                                  ? new Date(displayDate).toLocaleDateString()
                                  : "No date"}
                              </span>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  proposal.closed
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                }`}
                              >
                                {proposal.closed ? "Closed" : "Open"}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 pt-2">
                            {/* Description */}
                            {proposal.description && (
                              <div className="rounded-md border bg-muted/50 p-3">
                                <ExpandableText
                                  text={proposal.description}
                                  maxLength={150}
                                />
                              </div>
                            )}

                            {/* Edit Date */}
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Date
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
                                    ? new Date(displayDate).toLocaleDateString(
                                        "en-US",
                                        {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        },
                                      )
                                    : "No date set"}
                                </p>
                              )}
                            </div>

                            {/* Movies Section - Always visible with ranking-style cards */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                  Movies ({displayMovies.length})
                                </Label>
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setShowMovieSearch(!showMovieSearch)
                                    }
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add Movie
                                  </Button>
                                )}
                              </div>

                              {/* Movie Search */}
                              {isEditing && showMovieSearch && (
                                <Card className="p-3">
                                  <div className="space-y-3">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Search for a movie..."
                                        value={movieSearchQuery}
                                        onChange={(e) =>
                                          setMovieSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                          e.key === "Enter" && searchMovies()
                                        }
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
                                            onClick={() =>
                                              addMovieFromSearch(movie)
                                            }
                                            className="flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-accent"
                                          >
                                            {movie.i?.[0] && (
                                              <img
                                                src={movie.i[0]}
                                                alt={movie.l}
                                                className="h-12 w-8 rounded object-cover"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="truncate text-sm font-medium">
                                                {movie.l}{" "}
                                                {movie.y && `(${movie.y})`}
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

                              {/* Movie List - Ranking style cards */}
                              <div className="space-y-2">
                                {displayMovies.map((movie) => {
                                  const movieImage =
                                    movie.imageMedium || movie.i?.[0];
                                  const movieTitle = movie.title || movie.l;
                                  const movieYear = movie.year || movie.y;

                                  // Get ranking info if available and not editing
                                  const rankedMovie =
                                    !isEditing && rankings[proposal.id]
                                      ? rankings[
                                          proposal.id
                                        ].sorted_movies.find(
                                          (m) => m.id === movie.id,
                                        )
                                      : null;
                                  const isWinner =
                                    rankedMovie?.proposal_rank === 1;
                                  const winnersCount = rankings[proposal.id]
                                    ? rankings[
                                        proposal.id
                                      ].sorted_movies.filter(
                                        (m) => m.proposal_rank === 1,
                                      ).length
                                    : 0;
                                  const isTiedWinner =
                                    isWinner && winnersCount > 1;

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
                                          className="h-24 w-16 rounded object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="flex h-24 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground flex-shrink-0">
                                          No image
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                          <div className="flex-1 min-w-0">
                                            {!isEditing && isWinner && (
                                              <p className="text-xs text-primary font-semibold mb-1">
                                                {isTiedWinner
                                                  ? `Winner (tied with ${winnersCount - 1} other${winnersCount > 2 ? "s" : ""})`
                                                  : "Winner"}
                                              </p>
                                            )}
                                            <p
                                              className="font-semibold truncate"
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
                                            <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
                                          )}
                                        </div>
                                        {!isEditing && rankedMovie && (
                                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs">
                                            <span className="font-semibold">
                                              rank
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
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Voting Results Section - Individual Votes */}
                            {!isEditing &&
                              proposal.votes &&
                              proposal.votes.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                      Voting Results ({proposal.votes.length}{" "}
                                      votes)
                                    </Label>
                                  </div>

                                  <details className="rounded-lg border border-border/70 bg-card/50 p-3">
                                    <summary className="cursor-pointer list-none">
                                      <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-2">
                                          <Sparkles className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-semibold">
                                            Individual Votes
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
                                              {
                                                Object.keys(
                                                  vote.movie_selection,
                                                ).length
                                              }{" "}
                                              ranks
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {Object.keys(vote.movie_selection)
                                              .sort(
                                                (a, b) =>
                                                  parseInt(a) - parseInt(b),
                                              )
                                              .map((rank) => {
                                                const movieIds = vote
                                                  .movie_selection[
                                                  rank
                                                ] as string[];
                                                const movieTitles = movieIds
                                                  .map(
                                                    (id) =>
                                                      proposal.movies.find(
                                                        (m) => m.id === id,
                                                      )?.title,
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
                                                      {movieTitles.map(
                                                        (title, i) => (
                                                          <div
                                                            key={i}
                                                            className="rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5 text-xs"
                                                          >
                                                            {title}
                                                          </div>
                                                        ),
                                                      )}
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
                                  Owner:
                                </span>
                                <span className="font-medium">
                                  {proposal.owner?.type} -{" "}
                                  {proposal.owner?.name ??
                                    proposal.owner?.id.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Results:
                                </span>
                                <span className="font-medium">
                                  {proposal.show_results ? "Visible" : "Hidden"}
                                </span>
                              </div>
                              {proposal.winner && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Winner:
                                  </span>
                                  <span className="font-medium">
                                    {proposal.winner.title}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    onClick={() => saveEditing(proposal.id)}
                                    disabled={
                                      loading || editMovies.length === 0
                                    }
                                    size="sm"
                                  >
                                    Save Changes
                                  </Button>
                                  <Button
                                    onClick={cancelEditing}
                                    disabled={loading}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={
                                            proposal.closed ||
                                            (proposal.votes &&
                                              proposal.votes.length > 0)
                                              ? "cursor-not-allowed"
                                              : ""
                                          }
                                        >
                                          <Button
                                            onClick={() =>
                                              startEditing(proposal)
                                            }
                                            disabled={
                                              loading ||
                                              proposal.closed ||
                                              (proposal.votes &&
                                                proposal.votes.length > 0)
                                            }
                                            variant="outline"
                                            size="sm"
                                          >
                                            Edit
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {proposal.closed
                                          ? "Cannot edit closed proposal"
                                          : proposal.votes &&
                                              proposal.votes.length > 0
                                            ? "Cannot edit proposal with votes"
                                            : "Edit proposal"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={
                                          proposal.closed
                                            ? "cursor-not-allowed"
                                            : ""
                                        }
                                      >
                                        <Button
                                          onClick={() =>
                                            handleOpenCloseDialog(proposal)
                                          }
                                          disabled={loading || proposal.closed}
                                          variant={
                                            proposal.closed
                                              ? "outline"
                                              : "default"
                                          }
                                          size="sm"
                                        >
                                          Close
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {proposal.closed
                                        ? "Already closed"
                                        : "Close and select winner"}
                                    </TooltipContent>
                                  </Tooltip>

                                  {canReopen && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() =>
                                            handleReopenProposal(proposal)
                                          }
                                          disabled={loading}
                                          variant="outline"
                                          size="sm"
                                        >
                                          Reopen
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Reopen this proposal for voting
                                      </TooltipContent>
                                    </Tooltip>
                                  )}

                                  {!proposal.closed && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() =>
                                            handleToggleResults(proposal)
                                          }
                                          disabled={loading}
                                          variant={
                                            proposal.show_results
                                              ? "secondary"
                                              : "outline"
                                          }
                                          size="sm"
                                        >
                                          {proposal.show_results
                                            ? "Hide"
                                            : "Show"}{" "}
                                          Results
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Toggle results visibility
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}
            loader={
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading more proposals...
                </div>
              </div>
            }
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No proposals found for this cineforum.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Close Proposal Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Proposal</DialogTitle>
              <DialogDescription>
                Select the winning movie to close this proposal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {selectedProposal?.movies.map((movie) => (
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
                Cancel
              </Button>
              <Button
                onClick={handleCloseProposal}
                disabled={loading || !selectedWinnerId}
              >
                {loading ? "Closing..." : "Close Proposal"}
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

  // Check if user is admin or owner of this cineforum
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

  // Fetch initial proposals with pagination
  const limit = 10;
  const totalCount = await prisma.proposal.count({
    where: { cineforumId },
  });

  const proposals = await prisma.proposal.findMany({
    where: { cineforumId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      movies: { include: { movie: true } },
      round: true,
      ownerUser: true,
      ownerTeam: true,
      winner: true,
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    props: {
      ...cineforumProps.props,
      initialData: {
        proposals: proposals.map((proposal) => ({
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
            user: {
              id: v.user.id,
              name: v.user.name,
            },
            movie_selection: v.movieSelection as Record<string, string[]>,
          })),
          created_at: proposal.createdAt.toISOString(),
          missing_users: [],
          no_votes_left: false,
        })),
        pagination: {
          page: 1,
          limit,
          total: totalCount,
          hasMore: proposals.length < totalCount,
        },
      },
    },
  };
};
