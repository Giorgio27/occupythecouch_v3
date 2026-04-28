import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  tmdbFindAndDetails,
  omdbEnrichMovie,
  telegramNotify,
} from "@/lib/server/external";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

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

  const lastOpenRound = await prisma.round.findFirst({
    where: { cineforumId, closed: false },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

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
      },
      update: {
        // Always refresh image fields in case they were missing on first insert
        image: m.i?.[0] ?? undefined,
        imageMedium: m.i?.[1] ?? undefined,
        poster: tmdb.poster ?? undefined,
        imdbRating: omdb.imdb_rating ?? undefined,
        tomatometer: omdb.tomatometer ?? undefined,
        metascore: omdb.metascore ?? undefined,
      },
      select: { id: true },
    });

    connectMovies.push({ movieId: created.id });
  }

  const ownerField =
    candidate.type === "Team"
      ? { ownerTeamId: candidate.id }
      : { ownerUserId: candidate.id };

  const ownerNameQuery =
    candidate.type === "Team"
      ? prisma.team.findUnique({
          where: { id: candidate.id },
          select: { name: true },
        })
      : prisma.user.findUnique({
          where: { id: candidate.id },
          select: { name: true },
        });

  const [proposalRow, cineforum, ownerRecord] = await Promise.all([
    prisma.proposal.create({
      data: {
        cineforumId,
        roundId:
          lastOpenRound?.id ?? (await ensureDefaultRound(cineforumId)).id,
        title,
        description,
        date: new Date(date),
        ...ownerField,
        movies: { createMany: { data: connectMovies, skipDuplicates: true } },
      },
      select: { id: true, title: true },
    }),
    prisma.cineforum.findUnique({
      where: { id: cineforumId },
      select: { telegramBotToken: true, telegramChatId: true, locale: true },
    }),
    ownerNameQuery,
  ]);

  const isEn = cineforum?.locale === "en";
  const ownerName = ownerRecord?.name ?? "";
  const siteUrl = `${process.env.NEXTAUTH_URL ?? ""}/cineforum/${cineforumId}/proposal`;
  const formattedDate = new Date(date).toLocaleDateString(
    isEn ? "en-GB" : "it-IT",
  );
  const text = isEn
    ? `Hello everyone!\nThe proposal for ${formattedDate} is:\n\nBy ${ownerName}\n${title}\n\n${description}\n\nVote here: ${siteUrl}`
    : `Ciao a tutti!\nLa proposta per il ${formattedDate} è:\n\nDi ${ownerName}\n${title}\n\n${description}\n\nVota qui: ${siteUrl}`;
  telegramNotify(
    text,
    cineforum?.telegramBotToken ?? null,
    cineforum?.telegramChatId ?? null,
  ).catch(() => {});

  return res.status(201).json({ ok: true, id: proposalRow.id });
}

async function ensureDefaultRound(cineforumId: string) {
  return prisma.round.create({
    data: { cineforumId, name: "Round", closed: false },
    select: { id: true },
  });
}
