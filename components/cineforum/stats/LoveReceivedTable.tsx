import { useState, useMemo, useCallback, Fragment } from "react";
import { useTranslation } from "react-i18next";
import {
  Heart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { SectionHeader } from "@/components/cineforum/common";
import type {
  LoveReceivedDTO,
  UserProfileStatsDTO,
  UserRankingDTO,
} from "@/lib/shared/types";

type Props = {
  loveReceived: LoveReceivedDTO[];
  profileStats: UserProfileStatsDTO;
  users: UserRankingDTO[];
  selectedUserId: string;
};

export default function LoveReceivedTable({
  loveReceived,
  profileStats,
  users,
  selectedUserId,
}: Props) {
  const { t } = useTranslation("stats");
  // Sorting state
  const [receivedSortBy, setReceivedSortBy] = useState<
    "user" | "average" | "delta"
  >("average");
  const [receivedSortDir, setReceivedSortDir] = useState<"asc" | "desc">(
    "desc",
  );

  // Expanded rows state
  const [expandedReceivedRows, setExpandedReceivedRows] = useState<Set<string>>(
    new Set(),
  );

  // Sorting state for expanded movie details
  const [expandedSortBy, setExpandedSortBy] = useState<
    Record<string, "round" | "movie" | "rating" | "average" | "delta">
  >({});
  const [expandedSortDir, setExpandedSortDir] = useState<
    Record<string, "asc" | "desc">
  >({});

  // Prepare love received data
  const loveReceivedData = useMemo(() => {
    return loveReceived.map((lr) => ({
      user: lr.userName,
      userId: lr.userId,
      average: lr.averageVote,
      count: lr.count,
      votes: lr.votes,
      isSelectedUser: lr.userId === profileStats.user_id,
    }));
  }, [loveReceived, profileStats]);

  // Sort love received
  const sortedLoveReceived = useMemo(() => {
    const selectedUser = users.find((u) => u.user_id === selectedUserId);
    const sorted = [...loveReceivedData];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (receivedSortBy === "user") {
        comparison = a.user.localeCompare(b.user);
      } else if (receivedSortBy === "average") {
        comparison = a.average - b.average;
      } else if (receivedSortBy === "delta") {
        const baseAvg = selectedUser?.average_rating ?? 0;
        const deltaA = a.average - baseAvg;
        const deltaB = b.average - baseAvg;
        comparison = deltaA - deltaB;
      }
      return receivedSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [
    loveReceivedData,
    receivedSortBy,
    receivedSortDir,
    users,
    selectedUserId,
  ]);

  // Toggle sort handler
  const toggleReceivedSort = useCallback(
    (column: "user" | "average" | "delta") => {
      if (receivedSortBy === column) {
        setReceivedSortDir(receivedSortDir === "asc" ? "desc" : "asc");
      } else {
        setReceivedSortBy(column);
        setReceivedSortDir("desc");
      }
    },
    [receivedSortBy, receivedSortDir],
  );

  // Toggle expanded row
  const toggleExpandedRow = useCallback((userId: string) => {
    setExpandedReceivedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // Toggle sort for expanded movie details
  const toggleExpandedSort = useCallback(
    (
      userId: string,
      column: "round" | "movie" | "rating" | "average" | "delta",
    ) => {
      setExpandedSortBy((prev) => {
        return { ...prev, [userId]: column };
      });
      setExpandedSortDir((prev) => {
        const currentSort = expandedSortBy[userId] || "rating";
        const currentDir = prev[userId] || "desc";
        if (currentSort === column) {
          return { ...prev, [userId]: currentDir === "asc" ? "desc" : "asc" };
        } else {
          return { ...prev, [userId]: "desc" };
        }
      });
    },
    [expandedSortBy],
  );

  // Sort votes for a specific user
  const getSortedVotes = useCallback(
    (votes: LoveReceivedDTO["votes"], userId: string) => {
      const sortBy = expandedSortBy[userId] || "rating";
      const sortDir = expandedSortDir[userId] || "desc";

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
    [expandedSortBy, expandedSortDir],
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

  // Render sort icon for expanded tables
  const renderExpandedSortIcon = (
    userId: string,
    column: "round" | "movie" | "rating" | "average" | "delta",
  ) => {
    const currentSort = expandedSortBy[userId] || "rating";
    const currentDir = expandedSortDir[userId] || "desc";

    if (column !== currentSort) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return currentDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <SectionHeader
        icon={<Heart className="w-4 h-4" />}
        title={t("users.loveReceived")}
      />

      <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
        <p
          className="text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: t("users.loveReceivedDescription", {
              user: profileStats.user_name,
            }),
          }}
        />
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
                onClick={() => toggleReceivedSort("user")}
              >
                <div className="flex items-center">
                  {t("users.colUser")}
                  {renderSortIcon("user", receivedSortBy, receivedSortDir)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleReceivedSort("average")}
              >
                <div className="flex items-center justify-end">
                  {t("users.colAvgReceived")}
                  {renderSortIcon("average", receivedSortBy, receivedSortDir)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleReceivedSort("delta")}
              >
                <div className="flex items-center justify-end">
                  {t("users.delta")}
                  {renderSortIcon("delta", receivedSortBy, receivedSortDir)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLoveReceived.map((row) => {
              const isExpanded = expandedReceivedRows.has(row.userId);
              const delta = row.average - (selectedUser?.average_rating ?? 0);
              const sortedVotes = getSortedVotes(row.votes, row.userId);
              return (
                <Fragment key={row.userId}>
                  <tr
                    onClick={() => toggleExpandedRow(row.userId)}
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
                          ({t("users.selectedUser")})
                        </span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({row.count} film)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-right tabular-nums text-foreground">
                      {row.average.toFixed(2)}
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
                      <td colSpan={4} className="px-4 py-4 bg-secondary/30">
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("users.loveGiven")}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th
                                    className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedSort(row.userId, "round")
                                    }
                                  >
                                    <div className="flex items-center">
                                      {t("users.colRound")}
                                      {renderExpandedSortIcon(
                                        row.userId,
                                        "round",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-left text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedSort(row.userId, "movie")
                                    }
                                  >
                                    <div className="flex items-center">
                                      {t("users.colMovie")}
                                      {renderExpandedSortIcon(
                                        row.userId,
                                        "movie",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedSort(row.userId, "rating")
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      {t("users.colRatingGiven")}
                                      {renderExpandedSortIcon(
                                        row.userId,
                                        "rating",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedSort(row.userId, "average")
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      {t("users.colMovieAvg")}
                                      {renderExpandedSortIcon(
                                        row.userId,
                                        "average",
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="px-3 py-2 text-right text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() =>
                                      toggleExpandedSort(row.userId, "delta")
                                    }
                                  >
                                    <div className="flex items-center justify-end">
                                      {t("users.delta")}
                                      {renderExpandedSortIcon(
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
