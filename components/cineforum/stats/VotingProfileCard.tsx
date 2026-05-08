import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Users,
  Activity,
  AlertCircle,
  Info,
  Percent,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { StatCard, SectionHeader } from "@/components/cineforum/common";
import type { UserProfileStatsDTO, UserRankingDTO } from "@/lib/shared/types";

type Props = {
  profileStats: UserProfileStatsDTO;
  users: UserRankingDTO[];
  selectedUserId: string;
};

export default function VotingProfileCard({
  profileStats,
  users,
  selectedUserId,
}: Props) {
  // Determine user tendency
  const userTendency = useMemo(() => {
    if (profileStats.delta_from_global === null) return null;

    const delta = profileStats.delta_from_global;
    if (delta > 1.0)
      return {
        label: "Molto Generoso",
        color: "text-green-700",
        icon: TrendingUp,
      };
    if (delta > 0.5)
      return { label: "Generoso", color: "text-green-500", icon: TrendingUp };
    if (delta > 0.1)
      return {
        label: "Leggermente Generoso",
        color: "text-green-300",
        icon: TrendingUp,
      };
    if (delta < -0.1)
      return {
        label: "Leggermente Severo",
        color: "text-red-300",
        icon: TrendingDown,
      };
    if (delta < -0.5)
      return { label: "Severo", color: "text-red-500", icon: TrendingDown };
    if (delta < -1.0)
      return {
        label: "Molto Severo",
        color: "text-red-700",
        icon: TrendingDown,
      };
    return { label: "Equilibrato", color: "text-blue-500", icon: Target };
  }, [profileStats]);

  // Determine consistency
  const consistencyLevel = useMemo(() => {
    if (profileStats.standard_deviation === null) return null;

    const sd = profileStats.standard_deviation;
    if (sd < 0.5)
      return {
        label: "Molto Coerente",
        color: "bg-green-500/10 text-green-500 border-green-500/30",
      };
    if (sd < 1.0)
      return {
        label: "Coerente",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      };
    if (sd < 1.5)
      return {
        label: "Variabile",
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      };
    return {
      label: "Molto Variabile",
      color: "bg-red-500/10 text-red-500 border-red-500/30",
    };
  }, [profileStats]);

  // Delta value formatting
  const deltaValue =
    profileStats.delta_from_global !== null
      ? (profileStats.delta_from_global > 0 ? "+" : "") +
        profileStats.delta_from_global.toFixed(2)
      : null;

  const deltaClassName =
    profileStats.delta_from_global !== null
      ? profileStats.delta_from_global > 0
        ? "text-green-500"
        : profileStats.delta_from_global < 0
          ? "text-red-500"
          : "text-foreground"
      : undefined;

  return (
    <TooltipProvider>
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={<Award className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
          label="Media Utente"
          value={
            profileStats.average_rating !== null
              ? profileStats.average_rating.toFixed(2)
              : null
          }
          tooltip="La media di tutti i voti espressi da questo utente nel cineforum. Indica la tendenza generale dell'utente a votare alto o basso."
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          label="Media Globale"
          value={
            profileStats.global_average !== null
              ? profileStats.global_average.toFixed(2)
              : null
          }
          tooltip='La media di tutti i voti espressi da tutti gli utenti del cineforum. Rappresenta il "consenso generale" del gruppo.'
        />

        <StatCard
          icon={<Target className="w-5 h-5 text-amber-500" />}
          iconBg="bg-amber-500/10"
          label="Delta"
          value={deltaValue}
          valueClassName={deltaClassName}
          tooltip="La differenza tra la media dell'utente e la media globale. Positivo: l'utente vota più alto della media (generoso). Negativo: l'utente vota più basso della media (severo)."
        />

        <StatCard
          icon={<Activity className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-500/10"
          label="Film Votati"
          value={profileStats.total_votes}
        />
      </div>

      {/* Tendency & Consistency Section */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <SectionHeader
          icon={<AlertCircle className="w-4 h-4" />}
          title="Profilo Votante"
        />

        <div className="space-y-4">
          {/* Explanation text */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questo profilo analizza il comportamento di voto dell'utente
              rispetto al gruppo. La{" "}
              <strong className="text-foreground">tendenza</strong> indica se
              l'utente tende a votare più alto (generoso) o più basso (severo)
              rispetto alla media globale. La{" "}
              <strong className="text-foreground">coerenza</strong> misura
              quanto sono variabili i voti: un utente coerente dà voti simili
              tra loro, mentre uno variabile alterna voti molto alti e molto
              bassi. L'
              <strong className="text-foreground">
                accordo con il consenso
              </strong>{" "}
              mostra quanto spesso l'utente vota sopra o sotto la media del
              film.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Tendency */}
            {userTendency && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div
                  className={`rounded-lg p-2 ${userTendency.color} bg-current/10`}
                >
                  <userTendency.icon
                    className={`w-5 h-5 ${userTendency.color}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tendenza</p>
                  <p className={`text-sm font-bold ${userTendency.color}`}>
                    {userTendency.label}
                  </p>
                </div>
              </div>
            )}

            {/* Consistency */}
            {consistencyLevel && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Coerenza</p>
                  <Badge className={`${consistencyLevel.color} border`}>
                    {consistencyLevel.label}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    σ = {profileStats.standard_deviation?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Consensus Agreement */}
            {profileStats.above_consensus_percentage !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="rounded-lg bg-cyan-500/10 p-2">
                      <Percent className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        Sopra Consenso
                        <Info className="w-3 h-3" />
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {profileStats.above_consensus_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    La percentuale di volte in cui l'utente ha votato sopra la
                    media del film. Indica quanto spesso l'utente è più generoso
                    rispetto al consenso generale su ciascun film.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {profileStats.average_deviation_from_consensus !== null && (
            <div className="mt-4 border-t border-border pt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      Deviazione media dal consenso:
                      <Info className="w-3 h-3" />
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                      {profileStats.average_deviation_from_consensus.toFixed(2)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    La media delle differenze assolute tra i voti dell'utente e
                    la media di ciascun film. Misura quanto l'utente si discosta
                    tipicamente dal consenso, indipendentemente dalla direzione
                    (sopra o sotto). Valori più alti indicano opinioni più
                    divergenti dal gruppo.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
