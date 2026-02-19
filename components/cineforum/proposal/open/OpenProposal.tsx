import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Film, Sparkles, Vote, Trophy } from "lucide-react";
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
    <div className="space-y-6">
      {/* Top header / summary */}
      <div className="cine-card cine-glass relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cine-badge">
                <Sparkles className="mr-2 h-4 w-4" />
                Round aperto
              </span>
              {!canVote && (
                <span className="cine-badge" style={{ opacity: 0.85 }}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Risultati visibili
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-balance">
              <span className="text-gradient">Proposal</span>{" "}
              <span className="text-foreground/90">— {proposal.title}</span>
            </h2>

            {!!proposal?.description && (
              <div
                className="mt-3 prose prose-sm max-w-none prose-invert prose-p:text-muted-foreground prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: proposal.description }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 sm:pt-1">
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Film className="h-4 w-4 text-primary/70" />
              <span className="text-sm">
                {proposal?.movies?.length ?? 0} film
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Voting card */}
      <Card className="cine-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            Ordina i film per preferenza
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Label className="text-sm text-muted-foreground">
            Trascina/riordina (o usa i controlli del row) per creare la tua
            classifica.
          </Label>

          <div className="grid grid-cols-1 gap-2">
            {proposal?.movies?.map((m: any) => (
              <div key={m.id} className="cine-card hover-lift p-3">
                <MovieRankRow movie={m} lists={lists} setLists={setLists} />
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Il voto viene salvato e i risultati si aggiornano subito.
            </div>

            <Button
              className="cine-btn h-11"
              disabled={!canVote || submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await voteProposal(proposalId, lists);
                  const r = await fetchRanking(proposalId);
                  setRanking(r);
                  alert("Vote registered!");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Vote className="h-4 w-4" />
              {submitting ? "Invio…" : "Vota"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {ranking && (
        <Card className="cine-card relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Risultati attuali
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <ResultsPanel ranking={ranking} proposal={proposal} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
