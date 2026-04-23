import { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import { fetchTimelineRankings } from "@/lib/client/cineforum/rankings";
import type { TimelineYearDTO, TimelineMovieDTO } from "@/lib/shared/types";
import {
  CalendarDays,
  Film,
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

// ─── Decade helpers ──────────────────────────────────────────────────────────

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

function decadeLabel(decade: number): string {
  return `${decade}s`;
}

// ─── Bar chart cell ───────────────────────────────────────────────────────────

function YearBar({
  entry,
  maxCount,
  isSelected,
  onClick,
}: {
  entry: TimelineYearDTO;
  maxCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const heightPct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  const barHeight = Math.max(heightPct, 4); // minimum visible height

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-1 focus:outline-none transition-all duration-200 ${
        isSelected ? "scale-105" : "hover:scale-105"
      }`}
      title={`${entry.year} — ${entry.count} film`}
    >
      {/* Count label */}
      <span
        className={`text-xs font-bold transition-colors ${
          isSelected
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        }`}
      >
        {entry.count}
      </span>

      {/* Bar */}
      <div className="w-full flex items-end" style={{ height: "120px" }}>
        <div
          className={`w-full rounded-t-md transition-all duration-300 ${
            isSelected
              ? "bg-primary shadow-lg shadow-primary/30"
              : "bg-primary/40 group-hover:bg-primary/70"
          }`}
          style={{ height: `${barHeight}%` }}
        />
      </div>

      {/* Year label */}
      <span
        className={`text-[10px] sm:text-xs font-semibold transition-colors leading-tight text-center ${
          isSelected
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          height: "36px",
        }}
      >
        {entry.year}
      </span>
    </button>
  );
}

// ─── Movie pill ───────────────────────────────────────────────────────────────

function MoviePill({ movie }: { movie: TimelineMovieDTO }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {movie.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-10 h-14 object-cover rounded-md flex-shrink-0 shadow"
        />
      ) : (
        <div className="w-10 h-14 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {movie.title}
        </p>
        {movie.director && (
          <p className="text-xs text-muted-foreground truncate">
            {movie.director}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {movie.round}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Decade section ───────────────────────────────────────────────────────────

function DecadeSection({
  decade,
  years,
  maxCount,
  selectedYear,
  onYearClick,
}: {
  decade: number;
  years: TimelineYearDTO[];
  maxCount: number;
  selectedYear: number | null;
  onYearClick: (year: number) => void;
}) {
  const { t } = useTranslation("rankings");
  const [collapsed, setCollapsed] = useState(false);
  const totalMovies = years.reduce((s, y) => s + y.count, 0);

  return (
    <div className="cine-card overflow-hidden">
      {/* Decade header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg sm:text-xl font-black text-gradient">
            {decadeLabel(decade)}
          </span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {totalMovies} {t("timeline.decadeMovies")}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-6 pb-6">
          {/* Bar chart */}
          <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2 pt-2">
            {years.map((entry) => (
              <div
                key={entry.year}
                className="flex-shrink-0"
                style={{ minWidth: "32px", maxWidth: "56px", flex: "1" }}
              >
                <YearBar
                  entry={entry}
                  maxCount={maxCount}
                  isSelected={selectedYear === entry.year}
                  onClick={() => onYearClick(entry.year)}
                />
              </div>
            ))}
          </div>

          {/* Selected year detail */}
          {selectedYear !== null &&
            years.some((y) => y.year === selectedYear) && (
              <div className="mt-6 border-t border-border pt-5">
                {years
                  .filter((y) => y.year === selectedYear)
                  .map((y) => (
                    <div key={y.year}>
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary mb-4">
                        <CalendarDays className="w-4 h-4" />
                        {t("timeline.yearMoviesTitle", { year: y.year })}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {y.movies.map((movie) => (
                          <MoviePill key={movie.id} movie={movie} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimelineRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const { t } = useTranslation("rankings");
  const [data, setData] = useState<TimelineYearDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [cineforumId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetchTimelineRankings(cineforumId);
      setData(response.body);
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group years by decade
  const decades = useMemo(() => {
    const map = new Map<number, TimelineYearDTO[]>();
    for (const entry of data) {
      const d = decadeOf(entry.year);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(entry);
    }
    // Sort decades descending (most recent first)
    return Array.from(map.entries())
      .sort(([a], [b]) => b - a)
      .map(([decade, years]) => ({
        decade,
        years: years.sort((a, b) => a.year - b.year),
      }));
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 1),
    [data],
  );

  const totalMovies = useMemo(
    () => data.reduce((s, d) => s + d.count, 0),
    [data],
  );
  const totalYears = data.length;

  const handleYearClick = (year: number) => {
    setSelectedYear((prev) => (prev === year ? null : year));
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text={t("timeline.loading")} />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8 animate-fade-in">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("timeline.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            {t("timeline.pageSubtitle")}
          </p>
        </div>

        {data.length === 0 ? (
          <div className="cine-card text-center py-12 sm:py-16">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("timeline.emptyTitle")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("timeline.emptySubtitle")}
            </p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="cine-card px-5 py-4 text-center">
                <p className="text-2xl sm:text-3xl font-black text-gradient">
                  {totalMovies}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t("timeline.statMoviesSeen")}
                </p>
              </div>
              <div className="cine-card px-5 py-4 text-center">
                <p className="text-2xl sm:text-3xl font-black text-gradient">
                  {totalYears}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t("timeline.statYears")}
                </p>
              </div>
              <div className="cine-card px-5 py-4 text-center col-span-2 sm:col-span-1">
                <p className="text-2xl sm:text-3xl font-black text-gradient">
                  {data.length > 0
                    ? `${data[0].year}–${data[data.length - 1].year}`
                    : "—"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t("timeline.statTimespan")}
                </p>
              </div>
            </div>

            {/* Global bar chart overview */}
            <div className="cine-card px-4 sm:px-6 py-5 mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                {t("timeline.globalOverview")}
              </h2>
              <div
                className="flex items-end gap-0.5 sm:gap-1 overflow-x-auto pb-2"
                style={{ minHeight: "160px" }}
              >
                {data.map((entry) => (
                  <div
                    key={entry.year}
                    className="flex-shrink-0"
                    style={{ minWidth: "18px", maxWidth: "40px", flex: "1" }}
                  >
                    <YearBar
                      entry={entry}
                      maxCount={maxCount}
                      isSelected={selectedYear === entry.year}
                      onClick={() => handleYearClick(entry.year)}
                    />
                  </div>
                ))}
              </div>

              {/* Selected year detail in global view */}
              {selectedYear !== null && (
                <div className="mt-6 border-t border-border pt-5">
                  {data
                    .filter((y) => y.year === selectedYear)
                    .map((y) => (
                      <div key={y.year}>
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary mb-4">
                          <CalendarDays className="w-4 h-4" />
                          {t("timeline.yearMoviesTitle", { year: y.year })}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {y.movies.map((movie) => (
                            <MoviePill key={movie.id} movie={movie} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Decade sections */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("timeline.byDecade")}
              </h2>
              {decades.map(({ decade, years }) => (
                <DecadeSection
                  key={decade}
                  decade={decade}
                  years={years}
                  maxCount={maxCount}
                  selectedYear={selectedYear}
                  onYearClick={handleYearClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
