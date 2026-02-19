import * as React from "react";
import { Trophy, Medal, Sparkles, ChevronDown } from "lucide-react";

export default function ResultsPanel({
  ranking,
  proposal,
}: {
  ranking: any;
  proposal: any;
}) {
  const sorted = ranking?.sorted_movies ?? [];
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const chip = (t: string) => (
    <div className="rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs text-foreground/90">
      {t}
    </div>
  );

  const titleOf = (id: string) =>
    proposal.movies.find((mm: any) => mm.id === id)?.title;

  return (
    <div className="space-y-5">
      {/* Podium */}
      {top.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {top.map((m: any, idx: number) => {
            const isWinner = idx === 0;

            return (
              <div
                key={m.id}
                className={[
                  "relative overflow-hidden rounded-2xl border p-4 transition-all",
                  isWinner
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/70 bg-card/60",
                ].join(" ")}
              >
                {/* glow */}
                {isWinner && (
                  <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
                )}

                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {isWinner ? "Winner" : `Top ${idx + 1}`}
                    </div>

                    <div className="mt-1 truncate text-base font-black tracking-tight">
                      <span className={isWinner ? "text-gradient" : ""}>
                        {m.title} {m.year ? `(${m.year})` : ""}
                      </span>
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/90">
                        rank
                      </span>
                      <span className="text-primary">{m.proposal_rank}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        <Trophy className="h-4 w-4" /> #1
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2 py-1 text-xs font-semibold text-foreground/80">
                        <Medal className="h-4 w-4 text-primary/70" /> #{idx + 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest list */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((m: any) => (
            <div
              key={m.id}
              className="rounded-xl border border-border/70 bg-card/60 p-3 transition-all hover:border-primary/30 hover:bg-secondary/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {m.title} {m.year ? `(${m.year})` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    rank: {m.proposal_rank}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                  #{m.proposal_rank}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Votes detail */}
      <details className="rounded-2xl border border-border/70 bg-card/50 p-4">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="cine-badge">
                <Sparkles className="mr-2 h-4 w-4" />
                Peek other votes
              </span>
              <span className="text-xs text-muted-foreground">
                ({ranking?.votes?.length ?? 0})
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </summary>

        <div className="mt-4 space-y-3">
          {ranking.votes.map((v: any) => (
            <div
              key={v.id}
              className="rounded-xl border border-border/70 bg-secondary/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  User:{" "}
                  <span className="text-muted-foreground">{v.user.id}</span>
                </div>
                <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground">
                  {Object.keys(v.movie_selection).length} ranks
                </span>
              </div>

              <div className="space-y-3">
                {Object.keys(v.movie_selection)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((rk) => {
                    const titles = (v.movie_selection[rk] as string[])
                      .map((id) => titleOf(id))
                      .filter(Boolean) as string[];

                    return (
                      <div key={rk} className="flex items-start gap-3">
                        <div className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {rk}°
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {titles.length ? (
                            titles.map((t, i) => (
                              <React.Fragment key={i}>{chip(t)}</React.Fragment>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              —
                            </div>
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
  );
}
