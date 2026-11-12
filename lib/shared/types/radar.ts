// User radar types — the three PES-style hexagons on the user stats page.

export const PROFILE_AXES = [
  "talent",
  "cinephile",
  "presence",
  "speed",
  "harmony",
  "generosity",
] as const;
export type ProfileAxisKey = (typeof PROFILE_AXES)[number];

export const ERA_AXES = [
  "pre1960",
  "y1960_79",
  "y1980_99",
  "y2000_09",
  "y2010_19",
  "y2020_plus",
] as const;
export type EraKey = (typeof ERA_AXES)[number];

export const REGION_AXES = [
  "north_america",
  "western_europe",
  "eastern_europe",
  "east_asia",
  "rest_of_asia",
  "global_south",
] as const;
export type RegionKey = (typeof REGION_AXES)[number];

/** A "strength" axis: the member's percentile among active members. */
export type ProfileAxisDTO = {
  key: ProfileAxisKey;
  /** Percentile among active members with a value, 0–100. Null = no data. */
  score: number | null;
  /** The underlying metric, in its own unit (see the axis description). */
  raw: number | null;
};

/** A "taste" axis: the share of the member's proposed movies in a bucket. */
export type ShareAxisDTO<K extends string> = {
  key: K;
  /** 0–1, over the proposed movies whose year/country is known. */
  share: number;
  /** Movies in the bucket (fractional for co-productions across regions). */
  count: number;
};

export type CountryCountDTO = {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  count: number;
};

export type TasteRadarDTO = {
  eras: ShareAxisDTO<EraKey>[];
  regions: ShareAxisDTO<RegionKey>[];
  /** Most proposed countries (up to 3), each movie counted fully. */
  top_countries: CountryCountDTO[];
  /** Distinct movies proposed (solo or via a team) in closed rounds. */
  proposed_movies: number;
};

export type UserRadarDTO = TasteRadarDTO & {
  user_id: string;
  user_name: string;
  profile: ProfileAxisDTO[];
};

export type UserRadarResponseDTO = {
  body: UserRadarDTO[];
  /** Same taste hexagons computed over every proposed movie of the club. */
  club: TasteRadarDTO;
};
