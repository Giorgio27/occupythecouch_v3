import * as React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/client/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoundSummaryDTO } from "@/lib/shared/types";

type ListResponse = {
  status: "completed" | "progress";
  total: number;
  rounds: RoundSummaryDTO[];
};

const PAGE_SIZE = 10;

export default function CineforumRoundsAdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const cineforumId = router.query.cineforumId as string | undefined;

  const [rounds, setRounds] = React.useState<RoundSummaryDTO[]>([]);
  const [status, setStatus] = React.useState<"completed" | "progress" | null>(
    null
  );
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // form state
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");

  const openRounds = rounds.filter((r) => !r.closed);
  const hasOpenRound = openRounds.length > 0;
  const isCreateDisabled = creating || !name || !date || hasOpenRound;

  const canManage =
    sessionStatus === "authenticated" && !!session?.user && !!cineforumId;

  React.useEffect(() => {
    if (!cineforumId || !canManage) return;
    // load first page
    void loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cineforumId, canManage]);

  async function loadPage(pageToLoad: number, reset = false) {
    if (!cineforumId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        cineforumId,
        offset: String(pageToLoad * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/cineforum/rounds?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch rounds");
      const data: ListResponse = await res.json();

      setStatus(data.status);
      setPage(pageToLoad);
      setRounds((prev) => (reset ? data.rounds : [...prev, ...data.rounds]));
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error loading rounds");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!cineforumId) return;
    if (!name || !date) {
      setError("Name and date are required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/cineforum/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cineforumId,
          name,
          date,
          // chooserUserId: optional, default to current user
          chooserUserId:
            session?.user && "id" in session.user
              ? (session.user.id as string)
              : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create round");
      setName("");
      setDate("");
      // reload from first page to see newest rounds
      await loadPage(0, true);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error creating round");
    } finally {
      setCreating(false);
    }
  }

  async function onCloseRound(roundId: string) {
    if (!cineforumId) return;
    setClosingId(roundId);
    setError(null);
    try {
      const res = await fetch(`/api/cineforum/rounds/${roundId}/close`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 400 && body?.details) {
          // Human friendly message based on details
          const {
            openProposals,
            proposalsWithoutWinner,
            proposalsWithoutVotes,
          } = body.details as {
            openProposals?: { id: string; title: string }[];
            proposalsWithoutWinner?: { id: string; title: string }[];
            proposalsWithoutVotes?: { id: string; title: string }[];
          };

          const parts: string[] = [];
          if (openProposals?.length) {
            parts.push(
              `Open proposals: ${openProposals.map((p) => p.title).join(", ")}`
            );
          }
          if (proposalsWithoutWinner?.length) {
            parts.push(
              `Proposals without winner: ${proposalsWithoutWinner
                .map((p) => p.title)
                .join(", ")}`
            );
          }
          if (proposalsWithoutVotes?.length) {
            parts.push(
              `Proposals without votes: ${proposalsWithoutVotes
                .map((p) => p.title)
                .join(", ")}`
            );
          }

          setError(
            body.error || "Round cannot be closed. " + (parts.join(" · ") || "")
          );
        } else {
          throw new Error(body?.error || "Failed to close round");
        }
        return;
      }

      // refresh list
      await loadPage(0, true);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error closing round");
    } finally {
      setClosingId(null);
    }
  }

  if (sessionStatus === "loading" || !cineforumId) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          You must be logged in to manage rounds.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Rounds admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage rounds for this cineforum: create new ones, close them and
            trigger rankings computation.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Create round form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create new round</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onCreate}
              className="flex flex-col gap-4 md:flex-row md:items-end"
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor="round-name">Name</Label>
                <Input
                  id="round-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oscars 2025"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="round-date">Date</Label>
                <Input
                  id="round-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="pt-1 md:pt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* span needed because disabled button does not fire pointer events */}
                      <span
                        className={hasOpenRound ? "cursor-not-allowed" : ""}
                      >
                        <Button
                          type="submit"
                          disabled={isCreateDisabled}
                          className="w-full md:w-auto"
                        >
                          {creating ? "Creating..." : "Create"}
                        </Button>
                      </span>
                    </TooltipTrigger>

                    {hasOpenRound && (
                      <TooltipContent side="top">
                        <p>
                          You need to close the current open round before
                          creating a new one.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Rounds list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rounds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rounds.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No rounds yet. Create the first one above.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {rounds.map((round) => {
                const dateLabel = round.date
                  ? new Date(round.date).toLocaleDateString("it-IT")
                  : "No date";
                const chooserLabel =
                  round.chooser?.name ?? round.chooser?.email ?? "No chooser";

                return (
                  <div
                    key={round.id}
                    className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm md:flex-row md:items-center"
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{round.name}</span>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            round.closed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          )}
                        >
                          {round.closed ? "Closed" : "Open"}
                        </span>
                        {round.oscarable && (
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            Oscarable
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span>{dateLabel}</span>
                        <span className="mx-1">·</span>
                        <span>Chooser: {chooserLabel}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 md:pt-0">
                      {!round.closed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCloseRound(round.id)}
                          disabled={closingId === round.id}
                        >
                          {closingId === round.id
                            ? "Closing..."
                            : "Close round"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination / load more */}
            {status === "progress" && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPage(page + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
