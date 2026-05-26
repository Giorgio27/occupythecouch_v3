import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import type { SupportedLocale } from "@/lib/server/get-locale";
import { getCineforumPageMeta } from "@/lib/server/meta";
import { useTranslation } from "react-i18next";
import CineforumLayout from "@/components/CineforumLayout";
import { Loader2 } from "lucide-react";
import OscarsRoundCard from "@/components/cineforum/oscars/OscarsRoundCard";
import OscarsPageHeader from "@/components/cineforum/oscars/OscarsPageHeader";
import { OscarsRoundDTO } from "@/lib/shared/types/cineforum";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import { Trophy } from "lucide-react";

interface OscarsPageProps {
  cineforumId: string;
  cineforumName: string;
  initialLocale: SupportedLocale;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }
  return { props: { ...cineforumProps.props } };
};

export default function OscarsPage({
  cineforumId,
  cineforumName,
  initialLocale,
}: OscarsPageProps) {
  const { title: pageTitle, description: pageDescription } = getCineforumPageMeta(
    "oscars",
    initialLocale,
    cineforumName,
  );
  const { t } = useTranslation("oscars");
  const [rounds, setRounds] = useState<OscarsRoundDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(
            t("votingError", { message: "Failed to fetch rounds" }),
          );
        }
        const data = await response.json();
        if (isMounted) {
          setRounds((prev) => [...prev, ...data.body]);
          offset += limit;
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId, movieId, rating }),
        },
      );
      if (!response.ok) throw new Error("Failed to submit vote");
      const updatedRound = await response.json();
      setRounds((prev) =>
        prev.map((r) => (r.id === updatedRound.id ? updatedRound : r)),
      );
    } catch (err) {
      console.error("Error voting:", err);
      alert(
        `Error in vote movie: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <OscarsPageHeader cineforumName={cineforumName} />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 animate-fade-in">
          <p className="text-sm font-medium">{t("error")}</p>
        </div>
      )}

      {loading && rounds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">{t("loading")}</p>
        </div>
      )}

      {rounds.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Trophy className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t("empty.description")}
          </p>
        </div>
      )}

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

      {loading && rounds.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t("loadingMore")}</span>
        </div>
      )}
    </CineforumLayout>
    </>
  );
}
