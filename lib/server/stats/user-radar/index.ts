import prisma from "@/lib/prisma";
import {
  LOWER_IS_BETTER,
  getProfileMetrics,
  percentileOf,
} from "@/lib/server/stats/user-radar/profile";
import { buildTasteRadar, loadProposedMovies } from "@/lib/server/stats/user-radar/taste";
import {
  PROFILE_AXES,
  type ProfileAxisDTO,
  type UserRadarResponseDTO,
} from "@/lib/shared/types";

/**
 * Builds the three user-stats hexagons for every active member of a
 * cineforum: "profile" (strengths as percentiles among active members),
 * "eras" and "regions" (share of the movies they proposed in closed rounds),
 * plus the same taste hexagons for the whole club as a reference.
 */
export async function getUserRadar(cineforumId: string): Promise<UserRadarResponseDTO> {
  const [memberships, metrics, proposed] = await Promise.all([
    prisma.membership.findMany({
      where: { cineforumId, disabled: false },
      select: { user: { select: { id: true, name: true } } },
    }),
    getProfileMetrics(cineforumId),
    loadProposedMovies(cineforumId),
  ]);

  const memberIds = memberships.map((m) => m.user.id);

  // Percentiles are relative to active members only, so filter each axis first.
  const activeValues = PROFILE_AXES.map((key) => ({
    key,
    values: memberIds
      .map((id) => metrics[key].get(id))
      .filter((v): v is number => v !== undefined),
  }));

  const body = memberships.map(({ user }) => {
    const profile: ProfileAxisDTO[] = activeValues.map(({ key, values }) => {
      const raw = metrics[key].get(user.id);
      if (raw === undefined) return { key, score: null, raw: null };
      return { key, raw, score: percentileOf(raw, values, LOWER_IS_BETTER.has(key)) };
    });
    const movies = Array.from(proposed.byUser.get(user.id)?.values() ?? []);
    return {
      user_id: user.id,
      user_name: user.name ?? user.id,
      profile,
      ...buildTasteRadar(movies),
    };
  });

  return { body, club: buildTasteRadar(Array.from(proposed.club.values())) };
}
