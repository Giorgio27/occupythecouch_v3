import { useEffect, useState, type ReactNode } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import { getMovieTitleInCineforum } from "@/lib/server/movies/page-props";
import { fetchMovieDetail } from "@/lib/client/cineforum";
import CineforumLayout from "@/components/CineforumLayout";
import { EmptyState, LoadingCard } from "@/components/cineforum/common";
import {
  MovieAppearances,
  MovieHero,
  MovieOscars,
  MovieSameDirector,
  MovieVerdict,
} from "@/components/cineforum/movies/detail";
import type { CineforumLayoutServerProps } from "@/lib/server/cineforum-layout-props";
import type { MovieDetailDTO } from "@/lib/shared/types";

/**
 * One entrance per section, slightly staggered: enough to feel smooth without
 * animating every row. Long lists below the fold never animate item by item.
 */
const SECTION_STAGGER_MS = 80;

type PageSection = { key: string; node: ReactNode };

/** The sections to show, in order; empty ones are left out instead of rendered blank. */
function buildSections(detail: MovieDetailDTO): PageSection[] {
  const { movie, oscars, pendingOscars, appearances, sameDirector } = detail;
  const sections: PageSection[] = [
    { key: "hero", node: <MovieHero movie={movie} /> },
    { key: "verdict", node: <MovieVerdict movie={movie} oscars={oscars} /> },
  ];
  if (oscars.length > 0 || pendingOscars.length > 0) {
    sections.push({
      key: "oscars",
      node: <MovieOscars oscars={oscars} pendingOscars={pendingOscars} />,
    });
  }
  sections.push({
    key: "appearances",
    node: <MovieAppearances appearances={appearances} />,
  });
  if (movie.director && sameDirector.length > 0) {
    sections.push({
      key: "same-director",
      node: (
        <MovieSameDirector director={movie.director} movies={sameDirector} />
      ),
    });
  }
  return sections;
}

type MovieDetailPageProps = CineforumLayoutServerProps & {
  movieId: string;
  movieTitle: string;
};

export default function MovieDetailPage({
  cineforumId,
  cineforumName,
  movieId,
  movieTitle,
}: MovieDetailPageProps): JSX.Element {
  const { t } = useTranslation("movie");
  const [detail, setDetail] = useState<MovieDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Next keeps this page mounted when moving between movies (e.g. "More by
    // director"), so a slow response for the previous movie must be ignored.
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetchMovieDetail(cineforumId, movieId)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error("Error loading movie detail:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cineforumId, movieId]);

  const sections = detail ? buildSections(detail) : [];

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <Head>
        <title>{`${movieTitle} · ${cineforumName}`}</title>
      </Head>
      <div className="py-4 sm:py-6">
        <Link
          href={`/cineforum/${cineforumId}/movies`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("page.back")}
        </Link>

        {loading ? (
          <div className="flex min-h-100 items-center justify-center">
            <LoadingCard text={t("page.loading")} />
          </div>
        ) : !detail ? (
          <EmptyState
            title={t("page.errorTitle")}
            subtitle={t("page.errorSubtitle")}
            icon={<Film className="w-8 h-8 text-muted-foreground" />}
          />
        ) : (
          sections.map(({ key, node }, index) => (
            <div
              key={key}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * SECTION_STAGGER_MS}ms` }}
            >
              {node}
            </div>
          ))
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps<
  MovieDetailPageProps
> = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps)
    return cineforumProps;

  const props = await cineforumProps.props;
  const movieId = ctx.params?.movieId;
  if (typeof movieId !== "string") return { notFound: true };

  // Movies are global: a movie this club never proposed is a 404 here.
  const movieTitle = await getMovieTitleInCineforum(props.cineforumId, movieId);
  if (movieTitle === null) return { notFound: true };

  return { props: { ...props, movieId, movieTitle } };
};
