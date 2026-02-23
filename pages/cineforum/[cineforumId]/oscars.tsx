import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import CineforumLayout from "@/components/CineforumLayout";
import { Trophy, Loader2 } from "lucide-react";
import OscarsRoundCard from "@/components/cineforum/oscars/OscarsRoundCard";
import { OscarsRoundDTO } from "@/lib/shared/types/cineforum";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";

interface OscarsPageProps {
  cineforumId: string;
  cineforumName: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  return {
    props: {
      ...cineforumProps.props,
    },
  };
};

export default function OscarsPage({
  cineforumId,
  cineforumName,
}: OscarsPageProps) {
  const [rounds, setRounds] = useState<OscarsRoundDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rounds progressively (like Rails polling)
  useEffect(() => {
    let offset = 0;
    const limit = 1;
    let isMounted = true;

    const fetchRounds = async () => {
      try {
        const response = await fetch(
          `/api/cineforum/${cineforumId}/oscars/rounds?offset=${offset}&limit=${limit}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch rounds");
        }

        const data = await response.json();

        if (isMounted) {
          setRounds((prev) => [...prev, ...data.body]);
          offset += limit;

          // Continue polling if there are more rounds
          if (data.status === "progress") {
            setTimeout(fetchRounds, 100);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    fetchRounds();

    return () => {
      isMounted = false;
    };
  }, [cineforumId]);

  const handleVote = async (
    roundId: string,
    movieId: string,
    rating: number,
  ) => {
    try {
      const response = await fetch(
        `/api/cineforum/${cineforumId}/oscars/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roundId,
            movieId,
            rating,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      const updatedRound = await response.json();

      // Update the round in state
      setRounds((prev) =>
        prev.map((r) => (r.id === updatedRound.id ? updatedRound : r)),
      );
    } catch (err) {
      console.error("Error voting:", err);
      alert(
        `Error in vote movie: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      {/* Header Section */}
      <div className="mb-8 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Oscars
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              {cineforumName}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Vota i film dei round passati e scopri i vincitori di ogni ciclo
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 animate-fade-in">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading State - Initial */}
      {loading && rounds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">
            Caricamento round in corso...
          </p>
        </div>
      )}

      {/* Empty State */}
      {rounds.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Trophy className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Nessun round disponibile
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Non ci sono ancora round chiusi disponibili per gli Oscars
          </p>
        </div>
      )}

      {/* Rounds List */}
      <div className="space-y-4 sm:space-y-5">
        {rounds.map((round, index) => (
          <OscarsRoundCard
            key={round.id}
            round={round}
            isFirst={index === 0}
            onVote={handleVote}
          />
        ))}
      </div>

      {/* Loading State - Progressive */}
      {loading && rounds.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Caricamento altri round...</span>
        </div>
      )}
    </CineforumLayout>
  );
}
