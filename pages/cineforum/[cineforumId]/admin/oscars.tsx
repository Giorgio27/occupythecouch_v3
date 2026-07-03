import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import { fetchOscarsPreview } from "@/lib/client/cineforum/admin-oscars";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import CineforumLayout from "@/components/CineforumLayout";
import { OscarsPreviewRoundCard } from "@/components/cineforum/admin/oscars";
import type { OscarsRoundDTO } from "@/lib/shared/types";

interface OscarsAdminPageProps {
  cineforumId: string;
  cineforumName: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }
  return { props: { ...cineforumProps.props } };
};

export default function OscarsAdminPage({
  cineforumId,
  cineforumName,
}: OscarsAdminPageProps) {
  const { t } = useTranslation("admin");
  const { isAdmin, isLoading } = useAdminAccess(cineforumId);

  const [round, setRound] = useState<OscarsRoundDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cineforumId || !isAdmin) return;
    let cancelled = false;
    setLoading(true);
    fetchOscarsPreview(cineforumId)
      .then((res) => {
        if (!cancelled) setRound(res.body);
      })
      .catch((e) => {
        console.error("Error loading oscars preview:", e);
        if (!cancelled) setError(t("oscars.error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cineforumId, isAdmin, t]);

  if (isLoading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
          {t("oscars.loading")}
        </div>
      </CineforumLayout>
    );
  }

  // The hook redirects when not admin; render nothing meanwhile.
  if (!isAdmin) return null;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("oscars.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("oscars.pageSubtitle")}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground">{t("oscars.loading")}</p>
        )}

        {!loading && !round && (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
            <p className="text-sm font-semibold">{t("oscars.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("oscars.emptyDescription")}
            </p>
          </div>
        )}

        {!loading && round && <OscarsPreviewRoundCard round={round} />}
      </div>
    </CineforumLayout>
  );
}
