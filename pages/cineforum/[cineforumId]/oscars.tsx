import * as React from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import OscarsRoundCard from "@/components/cineforum/oscars/OscarsRoundCard";

interface MovieWinner {
  id: string;
  title: string;
  year: number | null;
  actors: string;
  image: string | null;
  imageMedium: string | null;
  poster: string | null;
  overview: string | null;
  roundRating: number | null;
  userRating: number | null;
  proposer: string;
  roundVotes: Array<{
    user: string;
    userName: string | null;
    rating: number;
  }>;
}

interface RoundBest {
  id: string;
  title: string;
  proposer: string;
  roundRating: number | null;
}

interface OscarsRound {
  id: string;
  name: string;
  closed: boolean;
  date: string | null;
  createdAt: string;
  chooser: {
    id: string;
    name: string | null;
  } | null;
  winners: MovieWinner[];
  bests: RoundBest[];
}

interface OscarsPageProps {
  cineforumId: string;
  cineforumName: string;
}

export async function getServerSideProps(ctx: any) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }

  const { cineforumId } = ctx.query;

  // Check membership
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: session.user.id,
        cineforumId,
      },
    },
    include: {
      cineforum: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!membership || membership.disabled) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  return {
    props: {
      cineforumId,
      cineforumName: membership.cineforum.name,
    },
  };
}

export default function OscarsPage({
  cineforumId,
  cineforumName,
}: OscarsPageProps) {
  const router = useRouter();
  const [rounds, setRounds] = React.useState<OscarsRound[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load rounds progressively (like Rails polling)
  React.useEffect(() => {
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
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Oscars</h1>
          <p className="text-muted-foreground">{cineforumName}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading && rounds.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Loading rounds...
          </div>
        )}

        {rounds.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            No oscarable rounds found.
          </div>
        )}

        <div className="space-y-4">
          {rounds.map((round, index) => (
            <OscarsRoundCard
              key={round.id}
              round={round}
              isFirst={index === 0}
              onVote={handleVote}
            />
          ))}
        </div>

        {loading && rounds.length > 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading more rounds...
          </div>
        )}
      </div>
    </Layout>
  );
}
