import { jsonFetch } from "@/lib/client/https";
import type {
  MoviesRankingResponseDTO,
  UsersRankingResponseDTO,
  DirectorRankingDTO,
  CountriesRankingResponseDTO,
  TimelineResponseDTO,
  ProposalUserStatsResponseDTO,
  ConsensusResponseDTO,
} from "@/lib/shared/types";

/**
 * Fetches movie rankings for a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param options - Pagination options
 * @returns Promise resolving to the movie rankings
 */
export async function fetchMovieRankings(
  cineforumId: string,
  options: { offset?: number; limit?: number; search?: string } = {},
): Promise<MoviesRankingResponseDTO> {
  const { offset = 0, limit = 20, search = "" } = options;
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  return jsonFetch<MoviesRankingResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/movies?offset=${offset}&limit=${limit}${searchParam}`,
  );
}

/**
 * Fetches user rankings for a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @param options - Pagination options
 * @returns Promise resolving to the user rankings
 */
export async function fetchUserRankings(
  cineforumId: string,
  options: { offset?: number; limit?: number } = {},
): Promise<UsersRankingResponseDTO> {
  const { offset = 0, limit = 100 } = options;
  return jsonFetch<UsersRankingResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/users?offset=${offset}&limit=${limit}`,
  );
}

/**
 * Fetches director rankings for a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @returns Promise resolving to the director rankings
 */
export async function fetchDirectorRankings(
  cineforumId: string,
): Promise<{ body: DirectorRankingDTO[]; status: string }> {
  return jsonFetch<{ body: DirectorRankingDTO[]; status: string }>(
    `/api/cineforum/${cineforumId}/rankings/directors`,
  );
}

/**
 * Fetches countries rankings for a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @returns Promise resolving to the countries rankings
 */
export async function fetchCountriesRankings(
  cineforumId: string,
): Promise<CountriesRankingResponseDTO> {
  return jsonFetch<CountriesRankingResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/countries`,
  );
}

/**
 * Fetches the release-year timeline for winner movies in a cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @returns Promise resolving to the timeline data grouped by year
 */
export async function fetchTimelineRankings(
  cineforumId: string,
): Promise<TimelineResponseDTO> {
  return jsonFetch<TimelineResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/timeline`,
  );
}

export async function fetchProposalUserStats(
  cineforumId: string,
): Promise<ProposalUserStatsResponseDTO> {
  return jsonFetch<ProposalUserStatsResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/proposals-stats`,
  );
}

/**
 * Fetches the consensus rankings (how divisive/unanimous each movie was) for a
 * cineforum.
 *
 * @param cineforumId - The unique identifier of the cineforum
 * @returns Promise resolving to the consensus rankings, sorted by divergence
 */
export async function fetchConsensusRankings(
  cineforumId: string,
): Promise<ConsensusResponseDTO> {
  return jsonFetch<ConsensusResponseDTO>(
    `/api/cineforum/${cineforumId}/rankings/consensus`,
  );
}
