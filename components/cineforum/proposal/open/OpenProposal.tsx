import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpandableText } from "@/components/ui/expandable-text";
import {
  Film,
  Sparkles,
  Vote,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  Users,
  ListOrdered,
  Inbox,
} from "lucide-react";
import RankingSlot from "./RankingSlot";
import MovieVotingCard from "./MovieVotingCard";
import ResultsPanel from "./ResultsPanel";
import LoadingCard from "../../common/LoadingCard";
import {
  fetchProposal,
  fetchRanking,
  voteProposal,
} from "@/lib/client/cineforum";

/** Open proposal block: loads detail, handles vote, optionally shows ranking */
export default function OpenProposal({ proposalId }: { proposalId: string }) {
  const { t } = useTranslation("proposal");
  const [loading, setLoading] = React.useState(true);
  const [proposal, setProposal] = React.useState<any | null>(null);

  // New state structure: positions (1-N) with arrays of movies
  const [rankedMovies, setRankedMovies] = React.useState<Record<number, any[]>>(
    {},
  );
  const [unrankedMovies, setUnrankedMovies] = React.useState<any[]>([]);
  const [draggingMovieId, setDraggingMovieId] = React.useState<string | null>(
    null,
  );

  const [ranking, setRanking] = React.useState<any | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [voteSuccess, setVoteSuccess] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProposal(proposalId);
        if (cancelled) return;
        setProposal(p);

        // Initialize empty positions
        const positions: Record<number, any[]> = {};
        for (let i = 1; i <= (p.movies?.length || 0); i++) {
          positions[i] = [];
        }

        // Check if user has already voted and pre-populate
        if (p.my_vote?.movie_selection) {
          const movieSelection = p.my_vote.movie_selection;
          const rankedMovieIds = new Set<string>();

          // Populate ranked positions from existing vote
          Object.entries(movieSelection).forEach(([position, movieIds]) => {
            const posNum = Number(position);
            const movies = (movieIds as string[])
              .map((id) => p.movies?.find((m: any) => m.id === id))
              .filter(Boolean);
            positions[posNum] = movies;
            movieIds.forEach((id) => rankedMovieIds.add(id));
          });

          // Remaining movies go to unranked
          const unranked = (p.movies || []).filter(
            (m: any) => !rankedMovieIds.has(m.id),
          );
          setUnrankedMovies(unranked);
        } else {
          // No existing vote: all movies start unranked
          setUnrankedMovies(p.movies || []);
        }

        setRankedMovies(positions);

        if (p.show_results) {
          const r = await fetchRanking(proposalId);
          setRanking(r);
        } else {
          setRanking(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  // Move movie to a specific position
  const moveMovieToPosition = (movieId: string, newPosition: number | null) => {
    setRankedMovies((prev) => {
      const next = { ...prev };

      // Remove movie from all positions
      Object.keys(next).forEach((pos) => {
        next[Number(pos)] = next[Number(pos)].filter((m) => m.id !== movieId);
      });

      return next;
    });

    setUnrankedMovies((prev) => {
      const filtered = prev.filter((m) => m.id !== movieId);

      if (newPosition === null) {
        // Move to unranked
        const movie = proposal?.movies?.find((m: any) => m.id === movieId);
        if (movie && !filtered.find((m) => m.id === movieId)) {
          return [...filtered, movie];
        }
      }

      return filtered;
    });

    if (newPosition !== null) {
      // Add to new position
      setRankedMovies((prev) => {
        const next = { ...prev };
        const movie = proposal?.movies?.find((m: any) => m.id === movieId);
        if (movie) {
          next[newPosition] = [...(next[newPosition] || []), movie];
        }
        return next;
      });
    }
  };

  // Handle drop on a position slot
  const handleDropOnPosition = (position: number, movieId: string) => {
    moveMovieToPosition(movieId, position);
  };

  // Handle drag start
  const handleDragStart = (movieId: string) => {
    setDraggingMovieId(movieId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingMovieId(null);
  };

  // Convert to API format for submission
  const prepareVoteData = () => {
    const lists: Record<string, string[]> = {};

    Object.entries(rankedMovies).forEach(([position, movies]) => {
      if (movies.length > 0) {
        lists[position] = movies.map((m) => m.id);
      }
    });

    return lists;
  };

  if (loading || !proposal) return <LoadingCard />;

  const canVote = !proposal?.closed;
  const hasExistingVote = !!proposal?.my_vote;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top header / summary */}
      <div className="cine-card cine-glass relative overflow-hidden border-primary/20">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="relative space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="cine-badge animate-scale-in">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("open.badge")}
                </span>
                {!canVote && (
                  <span className="cine-badge bg-primary/30 text-primary animate-scale-in delay-100">
                    <Trophy className="mr-2 h-4 w-4" />
                    {t("open.resultsVisibleBadge")}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
                  <span className="text-gradient">
                    {t("open.proposalTitle")}
                  </span>{" "}
                  <span className="text-foreground/90">— {proposal.title}</span>
                </h2>

                {!!proposal?.description && (
                  <div className="mt-3">
                    <ExpandableText
                      text={proposal.description}
                      maxLength={200}
                      className="prose prose-sm max-w-none prose-invert prose-p:text-muted-foreground prose-strong:text-foreground"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {proposal?.date && (
                <div className="cine-badge bg-muted/50">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {proposal.date}
                </div>
              )}
              <div className="cine-badge bg-muted/50">
                <Film className="mr-2 h-4 w-4" />
                {t("open.moviesCount", {
                  count: proposal?.movies?.length ?? 0,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting card */}
      <Card className="cine-card border-primary/20 animate-fade-in-up delay-100">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <span>{t("open.cardTitle")}</span>
            </CardTitle>

            {voteSuccess && (
              <div className="cine-badge bg-green-500/20 text-green-400 animate-scale-in">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("open.voteRegistered")}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Instructions */}
          <div className="cine-card p-4 bg-muted/30 border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 mt-0.5">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t("open.howItWorksTitle")}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("open.instructions")}
                </p>
              </div>
            </div>
          </div>

          {/* Two-column layout: Ranking Slots | Unranked Movies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Ranking Slots - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-3 lg:space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ListOrdered className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {t("open.yourRanking")}
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {t("open.rankingCount", {
                    ranked: Object.values(rankedMovies).flat().length,
                    total: proposal?.movies?.length || 0,
                  })}
                </span>
              </div>

              <div className="space-y-3">
                {Object.keys(rankedMovies)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((position) => (
                    <RankingSlot
                      key={position}
                      position={position}
                      movies={rankedMovies[position] || []}
                      totalPositions={proposal?.movies?.length || 0}
                      onMoviePositionChange={moveMovieToPosition}
                      onDrop={handleDropOnPosition}
                      draggingMovieId={draggingMovieId}
                    />
                  ))}
              </div>
            </div>

            {/* Unranked Movies - Takes 1 column on large screens */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 sticky top-4">
                <Inbox className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">
                  {t("open.unrankedMovies")}
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {unrankedMovies.length}
                </span>
              </div>

              <div className="space-y-2 sticky top-16">
                {unrankedMovies.length === 0 ? (
                  <div className="cine-card p-8 text-center border-dashed border-2 border-border/30">
                    <CheckCircle2 className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("open.allFilmsRanked")}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {t("open.readyToSubmit")}
                    </p>
                  </div>
                ) : (
                  unrankedMovies.map((movie, index) => (
                    <div
                      key={movie.id}
                      onDragStart={() => handleDragStart(movie.id)}
                      onDragEnd={handleDragEnd}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <MovieVotingCard
                        movie={movie}
                        currentPosition={null}
                        totalPositions={proposal?.movies?.length || 0}
                        onPositionChange={(pos) =>
                          moveMovieToPosition(movie.id, pos)
                        }
                        isDragging={draggingMovieId === movie.id}
                        isInUnranked={true}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {!canVote && (
            <div className="cine-card p-3 bg-primary/10 border-primary/30 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary/90">
                  {t("open.votingClosed")}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {canVote
                  ? hasExistingVote
                    ? t("open.updateVoteTitle")
                    : t("open.confirmVoteTitle")
                  : t("open.votingConcludedTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {canVote
                  ? hasExistingVote
                    ? t("open.updateVoteSubtitle")
                    : t("open.confirmVoteSubtitle")
                  : t("open.votingConcludedSubtitle")}
              </p>
            </div>

            <Button
              className="cine-btn h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl"
              disabled={!canVote || submitting || unrankedMovies.length > 0}
              onClick={async () => {
                setSubmitting(true);
                setVoteSuccess(false);
                try {
                  const voteData = prepareVoteData();
                  await voteProposal(proposalId, voteData);
                  const r = await fetchRanking(proposalId);
                  setRanking(r);
                  setVoteSuccess(true);
                  setTimeout(() => setVoteSuccess(false), 3000);
                } catch (error) {
                  alert(t("open.voteError"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("open.submitting")}
                </>
              ) : (
                <>
                  <Vote className="h-5 w-5" />
                  {hasExistingVote
                    ? t("open.updateButton")
                    : t("open.confirmButton")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {ranking && (
        <Card className="cine-card relative overflow-hidden border-primary/30 animate-fade-in-up delay-200">
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 animate-glow-pulse">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl">{t("open.rankingTitle")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-6">
            <ResultsPanel ranking={ranking} proposal={proposal} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
