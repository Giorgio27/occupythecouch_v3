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

  return (
    <TooltipProvider>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cine-card p-4 flex items-center gap-3 cursor-help">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Media Utente
                  <Info className="w-3 h-3" />
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {profileStats.average_rating !== null
                    ? profileStats.average_rating.toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              La media di tutti i voti espressi da questo utente nel cineforum.
              Indica la tendenza generale dell'utente a votare alto o basso.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cine-card p-4 flex items-center gap-3 cursor-help">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Media Globale
                  <Info className="w-3 h-3" />
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {profileStats.global_average !== null
                    ? profileStats.global_average.toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              La media di tutti i voti espressi da tutti gli utenti del
              cineforum. Rappresenta il "consenso generale" del gruppo.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cine-card p-4 flex items-center gap-3 cursor-help">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Delta
                  <Info className="w-3 h-3" />
                </p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    profileStats.delta_from_global !== null
                      ? profileStats.delta_from_global > 0
                        ? "text-green-500"
                        : profileStats.delta_from_global < 0
                          ? "text-red-500"
                          : "text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {profileStats.delta_from_global !== null
                    ? (profileStats.delta_from_global > 0 ? "+" : "") +
                      profileStats.delta_from_global.toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              La differenza tra la media dell'utente e la media globale.
              <br />
              <span className="text-green-500">Positivo</span>: l'utente vota
              più alto della media (generoso).
              <br />
              <span className="text-red-500">Negativo</span>: l'utente vota più
              basso della media (severo).
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="cine-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Film Votati</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {profileStats.total_votes}
            </p>
          </div>
        </div>
      </div>

      {/* Tendency & Consistency Section */}
      <div className="cine-card p-6 mb-8">
        <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Profilo Votante
        </h3>

        <div className="space-y-4">
          {/* Explanation text */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tendency */}
            {userTendency && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
                <div
                  className={`p-2 rounded-lg ${userTendency.color} bg-current/10`}
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
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Coerenza</p>
                  <Badge className={`${consistencyLevel.color} border`}>
                    {consistencyLevel.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    σ = {profileStats.standard_deviation?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Consensus Agreement */}
            {profileStats.above_consensus_percentage !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 cursor-help">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Percent className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
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
            <div className="mt-4 pt-4 border-t border-border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Deviazione media dal consenso:
                      <Info className="w-3 h-3" />
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
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
