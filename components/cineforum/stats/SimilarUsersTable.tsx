import { useState, useEffect, useCallback, Fragment } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/cineforum/common";
import { fetchCommonMovieVotes } from "@/lib/client/cineforum/stats";
import type { SimilarUserDTO, CommonMovieVoteDTO } from "@/lib/shared/types";

// ─── Types ─────────────────────────────────────────────────────────────────

type SortColumn =
  | "userName"
  | "score"
  | "pearson"
  | "commonRatings"
  | "compatibilityPercent"
  | "distancePenalty";
type SortDir = "asc" | "desc";

type DetailSortColumn = "movieTitle" | "targetRating" | "otherRating" | "delta";

type Props = {
  similarUsers: SimilarUserDTO[];
  cineforumId: string;
  targetUserId: string;
  targetUserName: string;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function ColHeader({
  label,
  tooltip,
  children,
}: {
  label: React.ReactNode;
  tooltip: string;
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3 h-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-left leading-snug">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      {children}
    </span>
  );
}

function SortIcon({
  column,
  current,
  dir,
}: {
  column: string;
  current: string;
  dir: SortDir;
}) {
  if (column !== current)
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 ml-1" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 ml-1" />
  );
}

function DeltaBadge({ value }: { value: number }) {
  const formatted = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  const cls =
    value > 0
      ? "text-green-500"
      : value < 0
        ? "text-red-500"
        : "text-muted-foreground";
  return <span className={`font-bold tabular-nums ${cls}`}>{formatted}</span>;
}

function CompatibilityBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 70
      ? "bg-green-500"
      : clamped >= 40
        ? "bg-yellow-500"
        : "bg-primary";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-foreground w-8 text-right">
        {clamped}%
      </span>
    </div>
  );
}

function DetailPanel({
  cineforumId,
  targetUserId,
  otherUserId,
  targetUserName,
  otherUserName,
}: {
  cineforumId: string;
  targetUserId: string;
  otherUserId: string;
  targetUserName: string;
  otherUserName: string;
}) {
  const { t } = useTranslation("stats");
  const [votes, setVotes] = useState<CommonMovieVoteDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<DetailSortColumn>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Lazy-load on first render of this panel
  useEffect(() => {
    setLoading(true);
    fetchCommonMovieVotes(cineforumId, targetUserId, otherUserId)
      .then((res) => setVotes(res.body))
      .catch(() => setVotes([]))
      .finally(() => setLoading(false));
  }, [cineforumId, targetUserId, otherUserId]);

  const toggleSort = useCallback((col: DetailSortColumn) => {
    setSortBy((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return col;
    });
  }, []);

  const sorted = votes
    ? [...votes].sort((a, b) => {
        let cmp = 0;
        if (sortBy === "movieTitle")
          cmp = a.movieTitle.localeCompare(b.movieTitle);
        else if (sortBy === "targetRating")
          cmp = a.targetRating - b.targetRating;
        else if (sortBy === "otherRating") cmp = a.otherRating - b.otherRating;
        else cmp = a.delta - b.delta;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : [];

  if (loading) {
    return (
      <div className="px-4 py-4 bg-secondary/30 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!votes || votes.length === 0) {
    return (
      <div className="px-4 py-4 bg-secondary/30 text-sm text-muted-foreground">
        {t("users.noCommonMovies")}
      </div>
    );
  }

  const thClass =
    "px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none";

  return (
    <div className="px-4 py-4 bg-secondary/30">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t("users.commonMoviesPanel", { count: votes.length })}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th
                className={`${thClass} text-left`}
                onClick={() => toggleSort("movieTitle")}
              >
                <div className="flex items-center">
                  {t("users.colMovie")}
                  <SortIcon
                    column="movieTitle"
                    current={sortBy}
                    dir={sortDir}
                  />
                </div>
              </th>
              <th
                className={`${thClass} text-right`}
                onClick={() => toggleSort("targetRating")}
              >
                <div className="flex items-center justify-end">
                  {targetUserName}
                  <SortIcon
                    column="targetRating"
                    current={sortBy}
                    dir={sortDir}
                  />
                </div>
              </th>
              <th
                className={`${thClass} text-right`}
                onClick={() => toggleSort("otherRating")}
              >
                <div className="flex items-center justify-end">
                  {otherUserName}
                  <SortIcon
                    column="otherRating"
                    current={sortBy}
                    dir={sortDir}
                  />
                </div>
              </th>
              <th
                className={`${thClass} text-right`}
                onClick={() => toggleSort("delta")}
              >
                <div className="flex items-center justify-end">
                  {t("users.delta")}
                  <SortIcon column="delta" current={sortBy} dir={sortDir} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => (
              <tr
                key={v.movieId}
                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <td className="px-3 py-2 text-foreground font-medium">
                  {v.movieTitle}
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-primary">
                  {v.targetRating.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {v.otherRating.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  <DeltaBadge value={v.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SimilarUsersTable({
  similarUsers,
  cineforumId,
  targetUserId,
  targetUserName,
}: Props) {
  const { t } = useTranslation("stats");
  const [sortBy, setSortBy] = useState<SortColumn>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = useCallback((col: SortColumn) => {
    setSortBy((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return col;
    });
  }, []);

  const toggleExpand = useCallback((userId: string) => {
    setExpandedId((prev) => (prev === userId ? null : userId));
  }, []);

  const sorted = [...similarUsers].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "userName") cmp = a.userName.localeCompare(b.userName);
    else if (sortBy === "score") cmp = a.score - b.score;
    else if (sortBy === "pearson") cmp = a.pearson - b.pearson;
    else if (sortBy === "commonRatings")
      cmp = a.commonRatings - b.commonRatings;
    else if (sortBy === "distancePenalty")
      cmp = a.distancePenalty - b.distancePenalty;
    else cmp = a.compatibilityPercent - b.compatibilityPercent;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const thClass =
    "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none";

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <SectionHeader
        icon={<Users className="w-4 h-4" />}
        title={t("users.similarUsers")}
        subtitle={t("users.similarUsersSubtitle")}
      />

      <Accordion type="single" collapsible className="mb-4">
        <AccordionItem
          value="how-it-works"
          className="border border-border rounded-xl overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline bg-secondary/30 hover:bg-secondary/50 transition-colors">
            {t("users.howCompatibilityWorks")}
          </AccordionTrigger>
          <AccordionContent className="px-4 bg-secondary/10">
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed pt-1">
              <p>{t("users.similarUsersAlgoIntro")}</p>

              {/* Factor 1: Pearson */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {t("users.algoFactor1Title")}
                </p>
                <p>{t("users.algoFactor1Body")}</p>
                <div className="ml-2 space-y-2 text-xs">
                  <p>
                    <strong className="text-foreground">
                      {t("users.algoFactor1WhyNotDiff")}
                    </strong>{" "}
                    {t("users.algoFactor1Example")}
                  </p>
                  <p>{t("users.algoFactor1Opposite")}</p>
                  <div className="p-2 rounded bg-secondary/50 border border-border font-mono text-center">
                    <span className="text-green-500">+1.0</span>
                    {" = "}
                    {t("users.algoFactor1Scale")
                      .split("|")[0]
                      .replace("+1.0 =", "")
                      .trim()}
                    {"\u00a0|\u00a0"}
                    <span className="text-muted-foreground">0.0</span>
                    {" = "}
                    {t("users.algoFactor1Scale")
                      .split("|")[1]
                      .replace("0.0 =", "")
                      .trim()}
                    {"\u00a0|\u00a0"}
                    <span className="text-red-500">-1.0</span>
                    {" = "}
                    {t("users.algoFactor1Scale")
                      .split("|")[2]
                      .replace("-1.0 =", "")
                      .trim()}
                  </div>
                  <p>{t("users.algoFactor1Threshold")}</p>
                  <p className="text-muted-foreground/70">
                    {t("users.algoFactor1ZeroVariance")}
                  </p>
                </div>
              </div>

              {/* Factor 2: Distance Penalty */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {t("users.algoFactor2Title")}
                </p>
                <p>{t("users.algoFactor2Body")}</p>
                <div className="ml-2 space-y-2 text-xs">
                  <p>
                    <strong className="text-foreground">
                      {t("users.algoFactor2How")}
                    </strong>{" "}
                    <code className="px-1 py-0.5 rounded bg-secondary font-mono">
                      avgAbsDiff
                    </code>
                  </p>
                  <div className="p-2 rounded bg-secondary/50 border border-border font-mono text-center">
                    {t("users.algoFactor2Formula")}
                  </div>
                  <p>{t("users.algoFactor2Divisor")}</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>{t("users.algoFactor2Diff0")}</li>
                    <li>{t("users.algoFactor2Diff1")}</li>
                    <li>{t("users.algoFactor2Diff2")}</li>
                    <li>{t("users.algoFactor2Diff4")}</li>
                  </ul>
                  <p>{t("users.algoFactor2Example")}</p>
                  <p>{t("users.algoFactor2ColNote")}</p>
                </div>
              </div>

              {/* Factor 3: Reliability Weight */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {t("users.algoFactor3Title")}
                </p>
                <p>{t("users.algoFactor3Body")}</p>
                <div className="ml-2 space-y-2 text-xs">
                  <div className="p-2 rounded bg-secondary/50 border border-border font-mono text-center">
                    {t("users.algoFactor3Formula")}
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>{t("users.algoFactor3Films15")}</li>
                    <li>{t("users.algoFactor3Films25")}</li>
                    <li>{t("users.algoFactor3Films50")}</li>
                  </ul>
                  <p>{t("users.algoFactor3Threshold")}</p>
                </div>
              </div>

              {/* Final formula */}
              <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  {t("users.algoFormulaTitle")}
                </p>
                <p className="text-xs font-mono text-foreground">
                  {t("users.algoFormula")}
                </p>
                <p className="text-xs font-mono">
                  {t("users.algoCompatFormula")}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {t("users.algoMinScore")}
                </p>
              </div>

              <p className="text-xs">{t("users.algoClickHint")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {similarUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t("users.similarUsersEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 w-10" />
                <th
                  className={`${thClass} text-left`}
                  onClick={() => toggleSort("userName")}
                >
                  <div className="flex items-center">
                    <ColHeader
                      label={t("users.colUser")}
                      tooltip={t("users.colUserTooltip")}
                    >
                      <SortIcon
                        column="userName"
                        current={sortBy}
                        dir={sortDir}
                      />
                    </ColHeader>
                  </div>
                </th>
                <th
                  className={`${thClass} text-right`}
                  onClick={() => toggleSort("compatibilityPercent")}
                >
                  <div className="flex items-center justify-end">
                    <ColHeader
                      label={t("users.colCompatibility")}
                      tooltip={t("users.colCompatibilityTooltip")}
                    >
                      <SortIcon
                        column="compatibilityPercent"
                        current={sortBy}
                        dir={sortDir}
                      />
                    </ColHeader>
                  </div>
                </th>
                <th
                  className={`${thClass} text-right hidden sm:table-cell`}
                  onClick={() => toggleSort("pearson")}
                >
                  <div className="flex items-center justify-end">
                    <ColHeader
                      label={t("users.colPearson")}
                      tooltip={t("users.colPearsonTooltip")}
                    >
                      <SortIcon
                        column="pearson"
                        current={sortBy}
                        dir={sortDir}
                      />
                    </ColHeader>
                  </div>
                </th>
                <th
                  className={`${thClass} text-right hidden sm:table-cell`}
                  onClick={() => toggleSort("commonRatings")}
                >
                  <div className="flex items-center justify-end">
                    <ColHeader
                      label={t("users.colCommonMovies")}
                      tooltip={t("users.colCommonMoviesTooltip")}
                    >
                      <SortIcon
                        column="commonRatings"
                        current={sortBy}
                        dir={sortDir}
                      />
                    </ColHeader>
                  </div>
                </th>
                <th
                  className={`${thClass} text-right hidden lg:table-cell`}
                  onClick={() => toggleSort("distancePenalty")}
                >
                  <div className="flex items-center justify-end">
                    <ColHeader
                      label={t("users.colVoteProximity")}
                      tooltip={t("users.colVoteProximityTooltip")}
                    >
                      <SortIcon
                        column="distancePenalty"
                        current={sortBy}
                        dir={sortDir}
                      />
                    </ColHeader>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((user) => {
                const isExpanded = expandedId === user.userId;
                return (
                  <Fragment key={user.userId}>
                    <tr
                      onClick={() => toggleExpand(user.userId)}
                      className={`border-b border-border transition-colors cursor-pointer hover:bg-secondary/50 ${isExpanded ? "border-b-0 bg-secondary/30" : ""}`}
                    >
                      <td className="px-4 py-3.5 text-sm">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                        {user.userName}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right">
                        <div className="flex flex-col gap-1 items-end min-w-28">
                          <CompatibilityBar
                            percent={user.compatibilityPercent}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {user.pearson.toFixed(3)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="text-xs tabular-nums"
                        >
                          {user.commonRatings}{" "}
                          {t("users.colMovie").toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                        {Math.round(user.distancePenalty * 100)}%
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border">
                        <td colSpan={6} className="p-0">
                          <DetailPanel
                            cineforumId={cineforumId}
                            targetUserId={targetUserId}
                            otherUserId={user.userId}
                            targetUserName={targetUserName}
                            otherUserName={user.userName}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
