import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import MovieRankRow from "./MovieRankRow";
import ResultsPanel from "./ResultsPanel";
import LoadingCard from "../../common/LoadingCard";
import {
  fetchProposal,
  fetchRanking,
  voteProposal,
} from "@/lib/client/cineforum";

/** Open proposal block: loads detail, handles vote, optionally shows ranking */
export default function OpenProposal({ proposalId }: { proposalId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [proposal, setProposal] = React.useState<any | null>(null);
  const [lists, setLists] = React.useState<Record<string, any[]>>({});
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

        const my = undefined as any;
        if (my?.movie_selection) {
          const init: Record<string, any[]> = {};
          Object.keys(my.movie_selection)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((rank) => {
              const ids: string[] = my.movie_selection[rank];
              init[rank] = ids
                .map((id) => p.movies.find((m: any) => m.id === id))
                .filter(Boolean);
            });
          setLists(init);
        } else {
          const init: Record<string, any[]> = {};
          let counter = 1;
          for (const m of p.movies) init[String(counter++)] = [m];
          setLists(init);
        }

        if (p.no_votes_left || p.show_results) {
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

  if (loading || !proposal) return <LoadingCard />;

  const canVote = !(proposal?.no_votes_left || proposal?.show_results);

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
                  Votazione aperta
                </span>
                {!canVote && (
                  <span className="cine-badge bg-primary/30 text-primary animate-scale-in delay-100">
                    <Trophy className="mr-2 h-4 w-4" />
                    Risultati visibili
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
                  <span className="text-gradient">Proposta</span>{" "}
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
                {proposal?.movies?.length ?? 0} film
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
              <span>Ordina i film per preferenza</span>
            </CardTitle>

            {voteSuccess && (
              <div className="cine-badge bg-green-500/20 text-green-400 animate-scale-in">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Voto registrato!
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="cine-card p-4 bg-muted/30 border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 mt-0.5">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Come funziona il voto
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trascina o riordina i film dalla tua preferenza più alta a
                  quella più bassa. Il sistema calcolerà automaticamente il
                  vincitore in base alle preferenze di tutti.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {proposal?.movies?.map((m: any, index: number) => (
              <div
                key={m.id}
                className="cine-card hover-lift p-4 border-primary/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MovieRankRow movie={m} lists={lists} setLists={setLists} />
              </div>
            ))}
          </div>

          {!canVote && (
            <div className="cine-card p-3 bg-primary/10 border-primary/30 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary/90">
                  La votazione è chiusa. I risultati sono visibili qui sotto.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {canVote ? "Conferma il tuo voto" : "Votazione conclusa"}
              </p>
              <p className="text-xs text-muted-foreground">
                {canVote
                  ? "Il voto viene salvato e i risultati si aggiornano in tempo reale."
                  : "Grazie per aver partecipato alla votazione!"}
              </p>
            </div>

            <Button
              className="cine-btn h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl"
              disabled={!canVote || submitting}
              onClick={async () => {
                setSubmitting(true);
                setVoteSuccess(false);
                try {
                  await voteProposal(proposalId, lists);
                  const r = await fetchRanking(proposalId);
                  setRanking(r);
                  setVoteSuccess(true);
                  setTimeout(() => setVoteSuccess(false), 3000);
                } catch (error) {
                  alert("Errore durante il voto. Riprova.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Invio in corso…
                </>
              ) : (
                <>
                  <Vote className="h-5 w-5" />
                  Conferma voto
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
              <span className="text-xl">Classifica attuale</span>
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
