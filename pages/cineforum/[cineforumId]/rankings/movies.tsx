import { GetServerSideProps } from "next";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Trophy, Film, Users, Star, Search, Loader2, User } from "lucide-react";
import { fetchMovieRankings } from "@/lib/client/cineforum";
import {
  RankingHeader,
  SupplierSelect,
  RankingCard,
  ComparisonTable,
} from "@/components/cineforum/rankings";
import { EmptyState } from "@/components/cineforum/common";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import type { MovieRankingDTO, Supplier } from "@/lib/shared/types";
import { SUPPLIERS } from "@/lib/shared/types";

const LIMIT = 20;
const DEBOUNCE_MS = 500;

type Props = {
  cineforumId: string;
  cineforumName: string;
};

/** Skeleton placeholder shown while the list is loading after a search reset. */
function RankingListSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function MoviesRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const { t } = useTranslation("rankings");

  const [rankings, setRankings] = useState<MovieRankingDTO[]>([]);
  // `listLoading` is true only during the initial fetch / search reset — not during loadMore
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(SUPPLIERS[0]);

  // Refs for values read inside the loadMore callback (avoids stale closures)
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isFetchingRef = useRef(false);
  const debouncedSearchRef = useRef("");

  // Keep debouncedSearchRef in sync
  useEffect(() => {
    debouncedSearchRef.current = debouncedSearch;
  }, [debouncedSearch]);

  // Debounce: search input → debouncedSearch (500 ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset + load first page whenever cineforumId or debouncedSearch changes
  useEffect(() => {
    let cancelled = false;

    const loadFirst = async () => {
      isFetchingRef.current = true;
      setListLoading(true);
      setRankings([]);
      setHasMore(false);
      setExpandedId(null);
      offsetRef.current = 0;
      hasMoreRef.current = false;

      try {
        const res = await fetchMovieRankings(cineforumId, {
          offset: 0,
          limit: LIMIT,
          search: debouncedSearch,
        });
        if (cancelled) return;
        setRankings(res.body);
        const more = res.status === "progress";
        hasMoreRef.current = more;
        setHasMore(more);
        offsetRef.current = res.body.length;
      } catch (err) {
        console.error("Error loading rankings:", err);
      } finally {
        isFetchingRef.current = false;
        if (!cancelled) setListLoading(false);
      }
    };

    loadFirst();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cineforumId, debouncedSearch]);

  // Load next page — called by InfiniteScroll when sentinel enters viewport
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const res = await fetchMovieRankings(cineforumId, {
        offset: offsetRef.current,
        limit: LIMIT,
        search: debouncedSearchRef.current,
      });
      setRankings((prev) => [...prev, ...res.body]);
      const more = res.status === "progress";
      hasMoreRef.current = more;
      setHasMore(more);
      offsetRef.current += res.body.length;
    } catch (err) {
      console.error("Error loading more rankings:", err);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [cineforumId]);

  const getRatingForSupplier = (ranking: MovieRankingDTO): number | null => {
    switch (selectedSupplier.id) {
      case "cineforum":       return ranking.average_rating;
      case "tmdb":            return ranking.tmdb_vote;
      case "imdb":            return ranking.imdb_rating;
      case "rotten_tomatoes": return ranking.tomatometer;
      case "metacritic":      return ranking.metascore;
      default:                return ranking.average_rating;
    }
  };

  // Client-side sort by selected supplier over all currently loaded items.
  // When supplier ≠ "cineforum" and more pages exist, the sort covers only
  // what's loaded — this is intentional UX (switch supplier → re-rank loaded items).
  const sortedRankings = [...rankings].sort((a, b) => {
    const ratingA = getRatingForSupplier(a) ?? -1;
    const ratingB = getRatingForSupplier(b) ?? -1;
    return ratingB - ratingA;
  });

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8 animate-fade-in">

        {/* Page Header — always visible */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("movies.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            {t("movies.pageSubtitle")}
          </p>
        </div>

        {/* Supplier select — always visible */}
        <SupplierSelect
          suppliers={SUPPLIERS}
          selectedSupplier={selectedSupplier}
          onSupplierChange={(s) => {
            setSelectedSupplier(s);
            setExpandedId(null);
          }}
        />

        {/* Search bar — always visible */}
        <div className="relative mb-6 sm:mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("movies.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              hover:border-primary/50 transition-all duration-200 text-sm"
          />
        </div>

        {/* List area — skeleton during reset, list otherwise */}
        {listLoading ? (
          <RankingListSkeleton />
        ) : sortedRankings.length === 0 ? (
          <EmptyState
            icon={<Film className="w-8 h-8 text-muted-foreground" />}
            title={debouncedSearch ? t("movies.noResults") : t("movies.emptyTitle")}
            subtitle={
              debouncedSearch
                ? t("movies.noResultsSubtitle", { query: debouncedSearch })
                : t("movies.emptySubtitle")
            }
          />
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3 mb-2">
              <RankingHeader title={t("movies.tableHeaderFilm")} />
            </div>

            <InfiniteScroll
              items={sortedRankings}
              hasMore={hasMore}
              isLoading={loadingMore}
              onLoadMore={handleLoadMore}
              threshold={300}
              renderItem={(ranking, index) => {
                const isExpanded = expandedId === ranking.id;
                const rating = getRatingForSupplier(ranking);

                return (
                  <RankingCard
                    key={ranking.id}
                    position={index + 1}
                    title={ranking.movie}
                    rating={rating}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : ranking.id)}
                    badges={
                      ranking.round_winner && (
                        <span
                          title={t("movies.winnerTitle", { round: ranking.round })}
                          className="flex items-center"
                        >
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                        </span>
                      )
                    }
                  >
                    <div className="space-y-6">
                      {/* Round + proposer badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {t("movies.roundLabel")}
                          </span>
                          <span className="font-bold text-foreground">
                            {ranking.round}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {t("movies.proposedByLabel")}
                          </span>
                          <span className="font-bold text-foreground">
                            {ranking.owner}
                          </span>
                        </div>
                      </div>

                      {/* User Votes */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                          <Users className="w-4 h-4" />
                          {t("movies.userVotesTitle")}
                        </h3>

                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                            <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              <div className="flex-1">{t("movies.colUser")}</div>
                              <div className="w-20 sm:w-24 text-right">
                                {t("movies.colRating")}
                              </div>
                            </div>
                          </div>
                          <div className="divide-y divide-border">
                            {ranking.movie_votes.map((vote) => (
                              <div
                                key={vote.id}
                                className="flex items-center px-4 py-3 sm:py-4 hover:bg-secondary/30 transition-colors"
                              >
                                <div className="flex-1">
                                  <span className="text-sm sm:text-base text-foreground font-medium">
                                    {vote.user}
                                  </span>
                                </div>
                                <div className="w-20 sm:w-24 text-right">
                                  <span className="font-bold text-sm sm:text-base text-gradient tabular-nums">
                                    {vote.rating.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Supplier Ratings Comparison */}
                      <ComparisonTable
                        title={t("movies.comparisonTitle")}
                        rows={[
                          { label: "Cineforum",       value: ranking.average_rating, difference: null },
                          { label: "TMDB",            value: ranking.tmdb_vote,      difference: ranking.tmdb_difference },
                          { label: "IMDB",            value: ranking.imdb_rating,    difference: ranking.imdb_difference },
                          { label: "Rotten Tomatoes", value: ranking.tomatometer,    difference: ranking.tomato_difference },
                          { label: "Metacritic",      value: ranking.metascore,      difference: ranking.meta_difference },
                        ]}
                      />
                    </div>
                  </RankingCard>
                );
              }}
              loader={
                <div className="flex justify-center items-center gap-2 py-8 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("movies.loadingMore")}
                </div>
              }
              endMessage={
                <p className="text-center text-muted-foreground text-xs py-8">
                  {t("movies.allLoaded", { count: sortedRankings.length })}
                </p>
              }
              className="space-y-2 sm:space-y-3"
            />
          </>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
