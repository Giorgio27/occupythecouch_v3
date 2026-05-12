import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Vote,
  Trophy,
  CheckCircle2,
  Loader2,
  Users,
  ListOrdered,
} from "lucide-react";
import RankingSlot from "./RankingSlot";
import ResultsPanel from "./ResultsPanel";
import LoadingCard from "../../common/LoadingCard";
import ProposalHeader from "./ProposalHeader";
import UnrankedPanel from "./UnrankedPanel";
import VotingFooter from "./VotingFooter";
import {
  fetchProposal,
  fetchRanking,
  voteProposal,
} from "@/lib/client/cineforum";
import type {
  ProposalDetailDTO,
  ProposalMovieDTO,
  ProposalRankingDTO,
} from "@/lib/shared/types";

export default function OpenProposal({ proposalId }: { proposalId: string }) {
  const { t } = useTranslation("proposal");
  const [loading, setLoading] = React.useState(true);
  const [proposal, setProposal] = React.useState<ProposalDetailDTO | null>(
    null,
  );
  const [rankedMovies, setRankedMovies] = React.useState<
    Record<number, ProposalMovieDTO[]>
  >({});
  const [unrankedMovies, setUnrankedMovies] = React.useState<
    ProposalMovieDTO[]
  >([]);
  const [draggingMovieId, setDraggingMovieId] = React.useState<string | null>(
    null,
  );
  const [touchDragOverPosition, setTouchDragOverPosition] = React.useState<
    number | null
  >(null);
  const [ranking, setRanking] = React.useState<ProposalRankingDTO | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [voteSuccess, setVoteSuccess] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    // NOTE: IIFE with cancellation flag — needed to prevent state update on unmount
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProposal(proposalId);
        if (cancelled) return;
        setProposal(p);

        const positions: Record<number, ProposalMovieDTO[]> = {};
        for (let i = 1; i <= (p.movies?.length || 0); i++) {
          positions[i] = [];
        }

        if (p.my_vote?.movie_selection) {
          const movieSelection = p.my_vote.movie_selection;
          const rankedMovieIds = new Set<string>();
          Object.entries(movieSelection).forEach(([position, movieIds]) => {
            const posNum = Number(position);
            const movies = (movieIds as string[])
              .map((id) => p.movies?.find((m) => m.id === id))
              .filter((m): m is ProposalMovieDTO => Boolean(m));
            positions[posNum] = movies;
            (movieIds as string[]).forEach((id) => rankedMovieIds.add(id));
          });
          setUnrankedMovies(
            (p.movies || []).filter((m) => !rankedMovieIds.has(m.id)),
          );
        } else {
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

  const moveMovieToPosition = (movieId: string, newPosition: number | null) => {
    setRankedMovies((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((pos) => {
        next[Number(pos)] = next[Number(pos)].filter((m) => m.id !== movieId);
      });
      return next;
    });

    setUnrankedMovies((prev) => {
      const filtered = prev.filter((m) => m.id !== movieId);
      if (newPosition === null) {
        const movie = proposal?.movies?.find((m) => m.id === movieId);
        if (movie && !filtered.find((m) => m.id === movieId)) {
          return [...filtered, movie];
        }
      }
      return filtered;
    });

    if (newPosition !== null) {
      setRankedMovies((prev) => {
        const next = { ...prev };
        const movie = proposal?.movies?.find((m) => m.id === movieId);
        if (movie) {
          next[newPosition] = [...(next[newPosition] || []), movie];
        }
        return next;
      });
    }
  };

  const handleDropOnPosition = (position: number, movieId: string) => {
    moveMovieToPosition(movieId, position);
  };

  const handleTouchDrop = (movieId: string, position: number) => {
    moveMovieToPosition(movieId, position);
    setTouchDragOverPosition(null);
  };

  const prepareVoteData = () => {
    const lists: Record<string, string[]> = {};
    Object.entries(rankedMovies).forEach(([position, movies]) => {
      if (movies.length > 0) {
        lists[position] = movies.map((m) => m.id);
      }
    });
    return lists;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setVoteSuccess(false);
    try {
      const voteData = prepareVoteData();
      await voteProposal(proposalId, voteData);
      const r = await fetchRanking(proposalId);
      setRanking(r);
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch {
      alert(t("open.voteError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !proposal) return <LoadingCard />;

  const canVote = !proposal?.closed;
  const hasExistingVote = !!proposal?.my_vote;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <ProposalHeader proposal={proposal} canVote={canVote} />

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
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
                      isTouchDragOver={touchDragOverPosition === position}
                      onTouchDrop={handleTouchDrop}
                      onTouchDragPositionChange={setTouchDragOverPosition}
                    />
                  ))}
              </div>
            </div>

            <UnrankedPanel
              movies={unrankedMovies}
              totalPositions={proposal?.movies?.length || 0}
              draggingMovieId={draggingMovieId}
              onDragStart={(id) => setDraggingMovieId(id)}
              onDragEnd={() => setDraggingMovieId(null)}
              onPositionChange={moveMovieToPosition}
              onTouchDrop={handleTouchDrop}
              onTouchDragPositionChange={setTouchDragOverPosition}
            />
          </div>

          <VotingFooter
            canVote={canVote}
            hasExistingVote={hasExistingVote}
            submitting={submitting}
            hasUnranked={unrankedMovies.length > 0}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      {ranking && proposal.show_results && (
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
