import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { tmdbFindAndDetails, omdbEnrichMovie } from "@/lib/server/external";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  }

  const { cineforumId, proposalId } = req.query;
  const { show_results, date, movies } = req.body;

  if (!cineforumId || typeof cineforumId !== "string") {
    return res.status(400).json({ error: "cineforumId is required" });
  }

  if (!proposalId || typeof proposalId !== "string") {
    return res.status(400).json({ error: "proposalId is required" });
  }

  // Check if current user is admin or owner of this cineforum
  const currentUserMembership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session.user as any).id,
        cineforumId,
      },
    },
  });

  if (
    !currentUserMembership ||
    !["ADMIN", "OWNER"].includes(currentUserMembership.role)
  ) {
    return res.status(403).json({
      error: "You must be an admin or owner to update proposals",
    });
  }

  try {
    // Verify the proposal exists and belongs to the cineforum
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        id: proposalId,
        cineforumId,
      },
      include: {
        movies: {
          include: { movie: true },
        },
        ownerUser: true,
        ownerTeam: true,
        winner: true,
      },
    });

    if (!existingProposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // Prepare update data
    const updateData: Prisma.ProposalUpdateInput = {};

    if (show_results !== undefined) {
      updateData.showResults = show_results;
    }

    if (date !== undefined) {
      updateData.date = date ? new Date(date) : null;
    }

    // Update the proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        movies: {
          include: { movie: true },
        },
        ownerUser: true,
        ownerTeam: true,
        winner: true,
        round: true,
      },
    });

    // Handle movie updates if provided
    if (movies !== undefined && Array.isArray(movies)) {
      // Remove all existing movie associations
      await prisma.proposalMovie.deleteMany({
        where: { proposalId },
      });

      // Add new movie associations
      if (movies.length > 0) {
        const connectMovies = [];

        for (const m of movies) {
          // Check if movie already exists in database
          let movieRecord = await prisma.movie.findUnique({
            where: { imdbId: m.id },
            select: { id: true },
          });

          // If movie doesn't exist, create it with full details
          if (!movieRecord) {
            const kind: "feature" | "TV movie" | "TV episode" =
              m.q || "feature";
            const tmdb = await tmdbFindAndDetails(m.id, kind);
            const omdb = await omdbEnrichMovie(m.id);

            movieRecord = await prisma.movie.create({
              data: {
                imdbId: m.id,
                title: m.l || m.title,
                actors: m.s || null,
                year: m.y || m.year || null,
                image: m.i?.[0] || m.imageMedium || null,
                imageMedium: m.i?.[1] || m.image || null,
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
                releaseDate: tmdb.release_date
                  ? new Date(tmdb.release_date)
                  : null,
                tmdbId: tmdb.tmdb_id ?? null,
                voteAverage: tmdb.vote_average ?? null,
                popularity: tmdb.popularity ?? null,
                imdbRating: omdb.imdb_rating ?? null,
                tomatometer: omdb.tomatometer ?? null,
                metascore: omdb.metascore ?? null,
              },
              select: { id: true },
            });
          }

          connectMovies.push({ proposalId, movieId: movieRecord.id });
        }

        await prisma.proposalMovie.createMany({
          data: connectMovies,
          skipDuplicates: true,
        });
      }

      // Fetch updated proposal with new movies
      const finalProposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          movies: {
            include: { movie: true },
          },
          ownerUser: true,
          ownerTeam: true,
          winner: true,
          round: true,
        },
      });

      if (!finalProposal) {
        return res
          .status(404)
          .json({ error: "Proposal not found after update" });
      }

      // Transform proposal to match DTO
      const serializedProposal = {
        id: finalProposal.id,
        date: finalProposal.date?.toISOString() || null,
        title: finalProposal.title,
        description: finalProposal.description,
        closed: finalProposal.closed,
        show_results: finalProposal.showResults,
        round: finalProposal.round?.name || null,
        roundId: finalProposal.roundId,
        winner: finalProposal.winner
          ? {
              id: finalProposal.winner.id,
              title: finalProposal.winner.title,
              year: finalProposal.winner.year,
              image: finalProposal.winner.image,
            }
          : null,
        owner: finalProposal.ownerUserId
          ? { id: finalProposal.ownerUserId, type: "User" as const }
          : { id: finalProposal.ownerTeamId!, type: "Team" as const },
        movies: finalProposal.movies.map((pm) => ({
          id: pm.movie.id,
          title: pm.movie.title,
          year: pm.movie.year,
          image: pm.movie.image,
          imageMedium: pm.movie.imageMedium,
        })),
        votes: [],
        created_at: finalProposal.createdAt.toISOString(),
        missing_users: [],
        no_votes_left: false,
      };

      return res.status(200).json(serializedProposal);
    }

    // Transform proposal to match DTO
    const serializedProposal = {
      id: updatedProposal.id,
      date: updatedProposal.date?.toISOString() || null,
      title: updatedProposal.title,
      description: updatedProposal.description,
      closed: updatedProposal.closed,
      show_results: updatedProposal.showResults,
      round: updatedProposal.round?.name || null,
      roundId: updatedProposal.roundId,
      winner: updatedProposal.winner
        ? {
            id: updatedProposal.winner.id,
            title: updatedProposal.winner.title,
            year: updatedProposal.winner.year,
            image: updatedProposal.winner.image,
          }
        : null,
      owner: updatedProposal.ownerUserId
        ? { id: updatedProposal.ownerUserId, type: "User" as const }
        : { id: updatedProposal.ownerTeamId!, type: "Team" as const },
      movies: updatedProposal.movies.map((pm) => ({
        id: pm.movie.id,
        title: pm.movie.title,
        year: pm.movie.year,
        image: pm.movie.image,
        imageMedium: pm.movie.imageMedium,
      })),
      votes: [],
      created_at: updatedProposal.createdAt.toISOString(),
      missing_users: [],
      no_votes_left: false,
    };

    return res.status(200).json(serializedProposal);
  } catch (error) {
    console.error("Update proposal error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
