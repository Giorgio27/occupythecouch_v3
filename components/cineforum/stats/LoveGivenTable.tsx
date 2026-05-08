import { useState, useMemo, useCallback, Fragment } from "react";
import {
  Gift,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { LoveGivenDTO, UserProfileStatsDTO } from "@/lib/shared/types";

type Props = {
  loveGiven: LoveGivenDTO[];
  profileStats: UserProfileStatsDTO;
};

export default function LoveGivenTable({ loveGiven, profileStats }: Props) {
  // Sorting state
  const [givenSortBy, setGivenSortBy] = useState<
    "user" | "average" | "averageRanking" | "delta"
  >("average");
  const [givenSortDir, setGivenSortDir] = useState<"asc" | "desc">("desc");

  // Expanded rows state
  const [expandedGivenRows, setExpandedGivenRows] = useState<Set<string>>(
    new Set(),
  );

  // Sorting state for expanded movie details
  const [expandedGivenSortBy, setExpandedGivenSortBy] = useState<
    Record<string, "round" | "movie" | "rating" | "average" | "delta">
  >({});
  const [expandedGivenSortDir, setExpandedGivenSortDir] = useState<
    Record<string, "asc" | "desc">
  >({});

  // Prepare love given data
  const loveGivenData = useMemo(() => {
    return loveGiven.map((lg) => ({
      user: lg.userName,
      userId: lg.userId,
      average: lg.averageVote,
      averageRanking: lg.averageRanking,
      count: lg.count,
      votes: lg.votes,
      isSelectedUser: lg.userId === profileStats.user_id,
    }));
  }, [loveGiven, profileStats]);

  // Sort love given
  const sortedLoveGiven = useMemo(() => {
    const sorted = [...loveGivenData];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (givenSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (givenSortBy === "average") {
        comparison = a.average - b.average;
      } else if (givenSortBy === "averageRanking") {
        const avgA = a.averageRanking ?? 0;
        const avgB = b.averageRanking ?? 0;
        comparison = avgA - avgB;
      } else if (givenSortBy === "delta") {
        const deltaA = a.average - (a.averageRanking ?? 0);
        const deltaB = b.average - (b.averageRanking ?? 0);
        comparison = deltaA - deltaB;
      }
      return givenSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [loveGivenData, givenSortBy, givenSortDir]);

  // Toggle sort handler
  const toggleGivenSort = useCallback(
    (column: "user" | "average" | "averageRanking" | "delta") => {
      if (givenSortBy === column) {
        setGivenSortDir(givenSortDir === "asc" ? "desc" : "asc");
      } else {
        setGivenSortBy(column);
        setGivenSortDir("desc");
      }
    },
    [givenSortBy, givenSortDir],
  );

  // Toggle expanded row for love given
  const toggleExpandedGivenRow = useCallback((userId: string) => {
    setExpandedGivenRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // Toggle sort for expanded movie details in love given
  const toggleExpandedGivenSort = useCallback(
    (
      userId: string,
      column: "round" | "movie" | "rating" | "average" | "delta",
    ) => {
      setExpandedGivenSortBy((prev) => {
        return { ...prev, [userId]: column };
      });
      setExpandedGivenSortDir((prev) => {
        const currentSort = expandedGivenSortBy[userId] || "rating";
        const currentDir = prev[userId] || "desc";
        if (currentSort === column) {
          return { ...prev, [userId]: currentDir === "asc" ? "desc" : "asc" };
        } else {
          return { ...prev, [userId]: "desc" };
        }
      });
    },
    [expandedGivenSortBy],
  );

  // Sort votes for a specific user in love given
  const getSortedGivenVotes = useCallback(
    (votes: LoveGivenDTO["votes"], userId: string) => {
      const sortBy = expandedGivenSortBy[userId] || "rating";
      const sortDir = expandedGivenSortDir[userId] || "desc";

      const sorted = [...votes];
      sorted.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "round") {
          comparison = a.round.localeCompare(b.round);
        } else if (sortBy === "movie") {
          comparison = a.movieTitle.localeCompare(b.movieTitle);
        } else if (sortBy === "rating") {
          comparison = a.rating - b.rating;
        } else if (sortBy === "average") {
          comparison = a.movieAverageVote - b.movieAverageVote;
        } else if (sortBy === "delta") {
          const deltaA = a.rating - a.movieAverageVote;
          const deltaB = b.rating - b.movieAverageVote;
          comparison = deltaA - deltaB;
        }
        return sortDir === "asc" ? comparison : -comparison;
      });
      return sorted;
    },
    [expandedGivenSortBy, expandedGivenSortDir],
  );

  // Render sort icon
  const renderSortIcon = (
    column: string,
    currentSort: string,
    currentDir: "asc" | "desc",
  ) => {
    if (column !== currentSort) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1" />
    );
  };

  // Render sort icon for expanded tables in love given
  const renderExpandedGivenSortIcon = (
    userId: string,
    column: "round" | "movie" | "rating" | "average" | "delta",
  ) => {
    const currentSort = expandedGivenSortBy[userId] || "rating";
    const currentDir = expandedGivenSortDir[userId] || "desc";

    if (column !== currentSort) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  return (
    <div className="cine-card p-6 mb-8">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Gift className="w-4 h-4" />
        Amore Dato
      </h3>

      <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quanto{" "}
          <strong className="text-foreground">{profileStats.user_name}</strong>{" "}
          ha votato in media i film proposti dagli altri utenti.
          <br />
          <strong className="text-foreground">Media Data</strong>: la media dei
          voti che {profileStats.user_name} ha dato ai film proposti dall'utente
          della riga.
          <br />
          <strong className="text-foreground">Media Ranking</strong>: la media
          globale dell'utente della riga nel cineforum (per confronto).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                {/* Expand column */}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleGivenSort("user")}
              >
                <div className="flex items-center">
                  Utente
                  {renderSortIcon("user", givenSortBy, givenSortDir)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleGivenSort("average")}
              >
                <div className="flex items-center justify-end">
                  Media Data
                  {renderSortIcon("average", givenSortBy, givenSortDir)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleGivenSort("averageRanking")}
              >
                <div className="flex items-center justify-end">
                  Media Ranking
                  {renderSortIcon("averageRanking", givenSortBy, givenSortDir)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleGivenSort("delta")}
              >
                <div className="flex items-center justify-end">
                  Delta
                  {renderSortIcon("delta", givenSortBy, givenSortDir)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLoveGiven.map((row) => {
              const isExpanded = expandedGivenRows.has(row.userId);
              const delta = row.average - (row.averageRanking ?? 0);
              const sortedVotes = getSortedGivenVotes(row.votes, row.userId);
              return (
                <Fragment key={row.userId}>
                  <tr
                    onClick={() => toggleExpandedGivenRow(row.userId)}
                    className={`border-b border-border transition-colors cursor-pointer ${
                      row.isSelectedUser
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-secondary/50"
                    } ${isExpanded ? "border-b-0" : ""}`}
                  >
                    <td className="px-4 py-3.5 text-sm">
                      <div className="p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                      {row.user}
                      {row.isSelectedUser && (
                        <span className="ml-2 text-xs text-primary font-semibold">
                          (utente selezionato)
                        </span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({row.count} film)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-foreground">
                      {row.average.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right tabular-nums text-muted-foreground">
                      {row.averageRanking !== null
                        ? row.averageRanking.toFixed(2)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums">
                      <span
                        className={
                          delta > 0
                            ? "text-green-500"
                            : delta < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                        }
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border">
                      <td colSpan={5} className="px-4 py-4 bg-secondary/30">
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Voti Dati ai Film di {row.user}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th
                                    className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedGivenSort(
                                        row.userId,
                                        "round",
                                      )
                                    }
                                  >
                                    <div className="flex items-center">
                                      Round
                                      {renderExpandedGivenSortIcon(
                                        row.userId,
                                        "round",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedGivenSort(
                                        row.userId,
                                        "movie",
                                      )
                                    }
                                  >
                                    <div className="flex items-center">
                                      Film
                                      {renderExpandedGivenSortIcon(
                                        row.userId,
                                        "movie",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedGivenSort(
                                        row.userId,
                                        "rating",
                                      )
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      Voto Dato
                                      {renderExpandedGivenSortIcon(
                                        row.userId,
                                        "rating",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedGivenSort(
                                        row.userId,
                                        "average",
                                      )
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      Media Film
                                      {renderExpandedGivenSortIcon(
                                        row.userId,
                                        "average",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedGivenSort(
                                        row.userId,
                                        "delta",
                                      )
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      Delta
                                      {renderExpandedGivenSortIcon(
                                        row.userId,
                                        "delta",
                                      )}
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedVotes.map((vote, idx) => {
                                  const voteDelta =
                                    vote.rating - vote.movieAverageVote;
                                  return (
                                    <tr
                                      key={`${row.userId}-${vote.movieTitle}-${vote.round}-${idx}`}
                                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                    >
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {vote.round}
                                      </td>
                                      <td className="px-3 py-2 text-foreground">
                                        {vote.movieTitle}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">
                                        {vote.rating.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                                        {vote.movieAverageVote.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold tabular-nums">
                                        <span
                                          className={
                                            voteDelta > 0
                                              ? "text-green-500"
                                              : voteDelta < 0
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                          }
                                        >
                                          {voteDelta > 0 ? "+" : ""}
                                          {voteDelta.toFixed(2)}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
