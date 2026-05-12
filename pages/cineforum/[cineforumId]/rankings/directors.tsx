import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Film } from "lucide-react";
import { fetchDirectorRankings } from "@/lib/client/cineforum/rankings";
import {
  DirectorsTableHeader,
  DirectorCard,
} from "@/components/cineforum/rankings/directors";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import EmptyState from "@/components/cineforum/common/EmptyState";
import type { DirectorRankingDTO } from "@/lib/shared/types";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type OrderCriteria = "average_rating" | "count";

export default function DirectorsRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const { t } = useTranslation("rankings");
  const [directors, setDirectors] = useState<DirectorRankingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCriteria, setOrderCriteria] =
    useState<OrderCriteria>("average_rating");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDirectors();
  }, [cineforumId]);

  const loadDirectors = async () => {
    try {
      setLoading(true);
      const response = await fetchDirectorRankings(cineforumId);
      setDirectors(response.body);
    } catch (error) {
      console.error("Error loading directors:", error);
    } finally {
      setLoading(false);
    }
  };

  const orderCriteriaOptions: { criteria: OrderCriteria; labelKey: string }[] =
    [
      { criteria: "average_rating", labelKey: "directors.sortAvgRating" },
      { criteria: "count", labelKey: "directors.sortCount" },
    ];

  const sortedDirectors = [...directors].sort((a, b) => {
    if (orderCriteria === "average_rating") {
      return b.average_rating - a.average_rating;
    }
    return b.count - a.count;
  });

  const getPosition = (index: number): number => {
    if (index === 0) return 1;
    const currentValue =
      orderCriteria === "average_rating"
        ? sortedDirectors[index].average_rating
        : sortedDirectors[index].count;
    const previousValue =
      orderCriteria === "average_rating"
        ? sortedDirectors[index - 1].average_rating
        : sortedDirectors[index - 1].count;

    if (currentValue === previousValue) {
      for (let i = index - 1; i >= 0; i--) {
        const iValue =
          orderCriteria === "average_rating"
            ? sortedDirectors[i].average_rating
            : sortedDirectors[i].count;
        if (iValue === currentValue) {
          if (i === 0) return 1;
        } else {
          return i + 2;
        }
      }
      return 1;
    }
    return index + 1;
  };

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-100">
          <LoadingCard text={t("directors.loading")} />
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
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("directors.pageTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            {t("directors.pageSubtitle")}
          </p>
        </div>

        {/* Order Criteria Select */}
        <div className="mb-6">
          <label
            htmlFor="orderCriteria"
            className="block text-sm font-medium mb-2 text-muted-foreground"
          >
            {t("directors.sortBy")}
          </label>
          <select
            id="orderCriteria"
            value={orderCriteria}
            onChange={(e) => setOrderCriteria(e.target.value as OrderCriteria)}
            className="w-full md:w-64 px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
          >
            {orderCriteriaOptions.map((option) => (
              <option key={option.criteria} value={option.criteria}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Directors List */}
        {sortedDirectors.length === 0 ? (
          <EmptyState
            title={t("directors.emptyTitle")}
            subtitle={t("directors.emptySubtitle")}
          />
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <DirectorsTableHeader />

            {sortedDirectors.map((director, index) => (
              <DirectorCard
                key={director.name}
                director={director}
                position={getPosition(index)}
                isExpanded={expandedIndex === index}
                onToggle={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
              />
            ))}
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
