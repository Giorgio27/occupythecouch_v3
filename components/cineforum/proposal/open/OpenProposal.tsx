import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import MovieRankRow from "./MovieRankRow";
import ResultsPanel from "./ResultsPanel";
import LoadingCard from "../../common/LoadingCard";

/** Open proposal block: loads detail, handles vote, optionally shows ranking */
export default function OpenProposal({ proposalId }: { proposalId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [proposal, setProposal] = React.useState<any | null>(null);
  const [lists, setLists] = React.useState<Record<string, any[]>>({});
  const [ranking, setRanking] = React.useState<any | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await fetch(`/api/cineforum/proposals/${proposalId}`).then(
          (r) => r.json()
        );
        if (cancelled) return;
        setProposal(p);

        // Initialize lists from user's vote if exists; fallback 1-per-movie
        // (You can wire your current user id here if you want pre-fill)
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
          const r = await fetch(
            `/api/cineforum/proposals/ranking/${proposalId}`
          ).then((x) => x.json());
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proposal — {proposal.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!!proposal?.description && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: proposal.description }}
            />
          )}
          <div className="space-y-3">
            <Label className="text-base">Order movies by preference</Label>
            <div className="grid grid-cols-1 gap-2">
              {proposal?.movies?.map((m: any) => (
                <MovieRankRow
                  key={m.id}
                  movie={m}
                  lists={lists}
                  setLists={setLists}
                />
              ))}
            </div>
            <div className="pt-2">
              <Button
                onClick={async () => {
                  await fetch("/api/cineforum/proposals/votes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ proposalId, lists }),
                  });
                  const r = await fetch(
                    `/api/cineforum/proposals/ranking/${proposalId}`
                  ).then((x) => x.json());
                  setRanking(r);
                  alert("Vote registered!");
                }}
              >
                Vote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {ranking && (
        <Card>
          <CardHeader>
            <CardTitle>Current results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsPanel ranking={ranking} proposal={proposal} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
