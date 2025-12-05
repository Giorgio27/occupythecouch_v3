export type TmdbMovieDetails = {
  adult?: boolean;
  tmdb_id?: number;
  original_language?: string;
  overview?: string;
  release_date?: string;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  poster?: string | null;
  budget?: number | null;
  genres?: any;
  homepage?: string | null;
  production_companies?: any;
  production_countries?: any;
  revenue?: number | null;
  runtime?: number | null;
  spoken_languages?: any;
  tagline?: string | null;
  director?: string | null;
  show_id?: number;
  season_number?: number;
  episode_number?: number;
};

export async function tmdbFindAndDetails(
  imdbId: string,
  kind: "feature" | "TV movie" | "TV episode"
): Promise<TmdbMovieDetails> {
  const key = process.env.TMDB_API_KEY!;
  const base = "https://api.themoviedb.org/3";

  const resp = await fetch(
    `${base}/find/${encodeURIComponent(
      imdbId
    )}?api_key=${key}&language=en-US&external_source=imdb_id`
  ).then((r) => r.json());

  if (kind === "TV episode") {
    const tv = resp?.tv_episode_results?.[0];
    if (!tv) return {};
    const info: TmdbMovieDetails = {
      release_date: tv.air_date
        ? new Date(tv.air_date).toISOString()
        : undefined,
      tmdb_id: tv.id,
      show_id: tv.show_id,
      season_number: tv.season_number,
      episode_number: tv.episode_number,
      overview: tv.overview,
      vote_average: tv.vote_average,
      vote_count: tv.vote_count,
    };
    const json2 = await fetch(
      `${base}/tv/${info.show_id}/season/${info.season_number}/episode/${info.episode_number}?api_key=${key}&language=en-US`
    ).then((r) => r.json());
    const director = (json2?.crew || []).find((c: any) => c.job === "Director");
    info.director = director?.name ?? null;
    return info;
  } else {
    const movie = resp?.movie_results?.[0];
    if (!movie) return {};
    const poster = movie.poster_path
      ? `http://image.tmdb.org/t/p/w45/${movie.poster_path}`
      : null;

    const basic: TmdbMovieDetails = {
      adult: movie.adult,
      tmdb_id: movie.id,
      original_language: movie.original_language,
      overview: movie.overview,
      release_date: movie.release_date
        ? new Date(movie.release_date).toISOString()
        : undefined,
      popularity: movie.popularity,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      poster,
    };

    const details = await fetch(
      `${base}/movie/${movie.id}?api_key=${key}&language=en-US`
    ).then((r) => r.json());
    Object.assign(basic, {
      budget: details?.budget ?? null,
      genres: details?.genres ?? null,
      homepage: details?.homepage ?? null,
      production_companies: details?.production_companies ?? null,
      production_countries: details?.production_countries ?? null,
      revenue: details?.revenue ?? null,
      runtime: details?.runtime ?? null,
      spoken_languages: details?.spoken_languages ?? null,
      tagline: details?.tagline ?? null,
    });

    const credits = await fetch(
      `${base}/movie/${movie.id}/credits?api_key=${key}&language=en-US`
    ).then((r) => r.json());
    const director = (credits?.crew || []).find(
      (c: any) => c.job === "Director"
    );
    basic.director = director?.name ?? null;
    return basic;
  }
}
