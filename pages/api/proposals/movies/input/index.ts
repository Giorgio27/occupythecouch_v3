import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import {
  omdbEnrichMovie,
  tmdbFindAndDetails,
  telegramNotify,
} from "@/lib/api/external";

// Accepts: { cineforumId, date, candidate: { type: "User" | "Team", id }, title, description, proposal: [imdbResultLike] }
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { cineforumId, date, candidate, title, description, proposal } =
    req.body || {};
  if (
    !cineforumId ||
    !date ||
    !title ||
    !description ||
    !candidate?.type ||
    !candidate?.id
  )
    return res.status(400).json({ error: "Missing fields" });
  if (!Array.isArray(proposal) || proposal.length === 0)
    return res.status(400).json({ error: "No movies provided" });

  // choose last non-closed round in cineforum (like old code)
  const lastOpenRound = await prisma.round.findFirst({
    where: { cineforumId, closed: false },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  // Upsert movies (by imdbId) with enrichment
  const connectMovies = [];
  for (const m of proposal as any[]) {
    const imdbId: string = m.id;
    const kind: "feature" | "TV movie" | "TV episode" = m.q;
    const tmdb = await tmdbFindAndDetails(imdbId, kind);
    const omdb = await omdbEnrichMovie(imdbId);

    const created = await prisma.movie.upsert({
      where: { imdbId },
      create: {
        imdbId,
        title: m.l,
        actors: m.s,
        year: m.y,
        image: m.i?.[0] ?? null,
        imageMedium: m.i?.[1] ?? null,
        originalLanguage: tmdb.original_language ?? null,
        overview: tmdb.overview ?? null,
        poster: tmdb.poster ?? null,
        budget: tmdb.budget ?? null,
        genres: (tmdb.genres as any) ?? null,
        homepage: tmdb.homepage ?? null,
        productionCompanies: (tmdb.production_companies as any) ?? null,
        productionCountries: (tmdb.production_countries as any) ?? null,
        revenue: tmdb.revenue ?? null,
        runtime: tmdb.runtime ?? null,
        spokenLanguages: (tmdb.spoken_languages as any) ?? null,
        tagline: tmdb.tagline ?? null,
        director: tmdb.director ?? null,
        releaseDate: tmdb.release_date ? new Date(tmdb.release_date) : null,
        tmdbId: tmdb.tmdb_id ?? null,
        voteAverage: tmdb.vote_average ?? null,
        popularity: tmdb.popularity ?? null,
        imdbRating: omdb.imdb_rating ?? null,
        tomatometer: omdb.tomatometer ?? null,
        metascore: omdb.metascore ?? null,
        adult: null,
      },
      update: {
        // refresh ratings/fields if needed
        imdbRating: omdb.imdb_rating ?? undefined,
        tomatometer: omdb.tomatometer ?? undefined,
        metascore: omdb.metascore ?? undefined,
      },
      select: { id: true },
    });

    connectMovies.push({ movieId: created.id });
  }

  // Owner: either user or team
  const ownerField =
    candidate.type === "Team"
      ? { ownerTeamId: candidate.id }
      : { ownerUserId: candidate.id };

  const proposalRow = await prisma.proposal.create({
    data: {
      cineforumId,
      roundId: lastOpenRound?.id ?? (await ensureDefaultRound(cineforumId)).id,
      title,
      description,
      date: new Date(date),
      ...ownerField,
      movies: { createMany: { data: connectMovies, skipDuplicates: true } },
    },
    select: { id: true, title: true },
  });

  // Telegram notify like old code
  const text =
    `Ciao silvanotti/e\n` +
    `La proposta per il ${new Date(date).toLocaleDateString("it-IT")} è:\n\n` +
    `Di ${candidate.type} ${candidate.id}\n` + // replace with lookup if you want names
    `${title}\n\n` +
    `Per votare: [Sito Cineforum]`;
  telegramNotify(text).catch(() => {});

  return res.status(201).json({ ok: true, id: proposalRow.id });
}

async function ensureDefaultRound(cineforumId: string) {
  // create a default open round if none exists
  return prisma.round.create({
    data: {
      cineforumId,
      name: "Round",
      closed: false,
    },
    select: { id: true },
  });
}
