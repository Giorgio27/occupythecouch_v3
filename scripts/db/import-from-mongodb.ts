import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mappa MongoDB ObjectId → Prisma cuid
const idMap = new Map<string, string>();

interface MongoData {
  users: any[];
  movies: any[];
  rounds: any[];
  teams: any[];
  proposals: any[];
  proposalVotes: any[];
  movieVotes: any[];
  movieRoundRankings: any[];
  userRankings: any[];
}

async function importData() {
  console.log("📥 Importazione dati in PostgreSQL...\n");

  // Leggi export MongoDB
  const data: MongoData = JSON.parse(
    fs.readFileSync("data/mongodb-export.json", "utf-8"),
  );

  // 1. Crea Cineforum di default
  console.log("1️⃣ Creazione Cineforum...");
  const cineforum = await prisma.cineforum.create({
    data: {
      name: "OccupyTheCouch",
      description: "Dati migrati da cineforum-v2",
    },
  });
  console.log(`   ✓ Cineforum creato: ${cineforum.id}`);

  // 2. Importa Users
  console.log("\n2️⃣ Importazione Users...");
  const defaultPassword = await bcrypt.hash("password", 10);

  for (const mongoUser of data.users) {
    // Usa la password originale da MongoDB se disponibile, altrimenti usa "password"
    const passwordHash = mongoUser.encrypted_password || defaultPassword;

    const prismaUser = await prisma.user.create({
      data: {
        email: mongoUser.email,
        name: mongoUser.username || mongoUser.email.split("@")[0],
        passwordHash: passwordHash,
      },
    });
    idMap.set(mongoUser._id.toString(), prismaUser.id);

    // Crea Membership
    const isAdmin = mongoUser.roles_mask && (mongoUser.roles_mask & 1) !== 0;
    // Se is_active non è definito o è false, l'utente è disabled
    const isDisabled =
      mongoUser.is_active === undefined || mongoUser.is_active === false;
    await prisma.membership.create({
      data: {
        userId: prismaUser.id,
        cineforumId: cineforum.id,
        role: isAdmin ? "ADMIN" : "MEMBER",
        disabled: isDisabled,
      },
    });
  }
  console.log(`   ✓ Importati ${data.users.length} users`);

  // 3. Importa Movies (include TvEpisode)
  console.log("\n3️⃣ Importazione Movies...");
  let movieCount = 0;
  for (const mongoMovie of data.movies) {
    console.log(`   Importando movie ${++movieCount}/${data.movies.length}...`);
    const isTvEpisode = mongoMovie._type === "TvEpisode";

    const prismaMovie = await prisma.movie.create({
      data: {
        title: mongoMovie.title,
        imdbId: mongoMovie.imdb_id,
        year: mongoMovie.year,
        runtime: mongoMovie.runtime,
        overview: mongoMovie.overview,
        originalLanguage: mongoMovie.original_language,
        poster: mongoMovie.poster,
        image: mongoMovie.image,
        imageMedium: `${mongoMovie.image_medium}`,
        adult: mongoMovie.adult,
        tmdbId: parseInt(mongoMovie.tmdb_id),
        popularity: mongoMovie.popularity,
        voteAverage: mongoMovie.vote_average,
        imdbRating: mongoMovie.imdb_rating,
        tomatometer: mongoMovie.tomatometer,
        metascore: mongoMovie.metascore,
        budget: mongoMovie.budget,
        revenue: mongoMovie.revenue,
        releaseDate: mongoMovie.relase_date
          ? new Date(mongoMovie.relase_date)
          : null,
        actors: mongoMovie.actors,
        genres: mongoMovie.genres,
        productionCompanies: mongoMovie.production_companies,
        productionCountries: mongoMovie.production_countries,
        spokenLanguages: mongoMovie.spoken_languages,
        tagline: mongoMovie.tagline,
        director: mongoMovie.director,
        homepage: mongoMovie.homepage,
        // TV Episode fields
        showId: isTvEpisode ? mongoMovie.show_id : null,
        seasonNumber: isTvEpisode ? mongoMovie.season_number : null,
        episodeNumber: isTvEpisode ? mongoMovie.episode_number : null,
      },
    });
    idMap.set(mongoMovie._id.toString(), prismaMovie.id);
  }
  console.log(`   ✓ Importati ${data.movies.length} movies`);

  // 4. Importa Rounds
  console.log("\n4️⃣ Importazione Rounds...");
  for (const mongoRound of data.rounds) {
    const prismaRound = await prisma.round.create({
      data: {
        name: mongoRound.name,
        closed: mongoRound.closed || false,
        date: mongoRound.date ? new Date(mongoRound.date) : null,
        oscarable: mongoRound.oscarable || false,
        cineforumId: cineforum.id,
        chooserId: mongoRound.chooser_id
          ? idMap.get(mongoRound.chooser_id.toString())
          : null,
      },
    });
    idMap.set(mongoRound._id.toString(), prismaRound.id);
  }
  console.log(`   ✓ Importati ${data.rounds.length} rounds`);

  // 5. Importa Teams
  console.log("\n5️⃣ Importazione Teams...");
  for (const mongoTeam of data.teams) {
    const prismaTeam = await prisma.team.create({
      data: {
        name: mongoTeam.name,
        cineforumId: cineforum.id,
        roundId: mongoTeam.round_id
          ? idMap.get(mongoTeam.round_id.toString())
          : null,
      },
    });
    idMap.set(mongoTeam._id.toString(), prismaTeam.id);

    // Crea TeamUser per ogni user
    if (mongoTeam.user_ids && Array.isArray(mongoTeam.user_ids)) {
      for (const userId of mongoTeam.user_ids) {
        const prismaUserId = idMap.get(userId.toString());
        if (prismaUserId) {
          await prisma.teamUser.create({
            data: {
              teamId: prismaTeam.id,
              userId: prismaUserId,
            },
          });
        }
      }
    }
  }
  console.log(`   ✓ Importati ${data.teams.length} teams`);

  // 6. Importa Proposals
  console.log("\n6️⃣ Importazione Proposals...");
  let proposalCount = 0;
  for (const mongoProposal of data.proposals) {
    console.log(
      `   Importando proposal ${++proposalCount}/${data.proposals.length}...`,
    );
    const prismaProposal = await prisma.proposal.create({
      data: {
        title: mongoProposal.title || "Proposta",
        description: mongoProposal.description,
        date: mongoProposal.date ? new Date(mongoProposal.date) : null,
        closed: mongoProposal.closed || false,
        showResults: mongoProposal.show_results || false,
        cineforumId: cineforum.id,
        roundId: idMap.get(mongoProposal.round_id.toString())!,
        ownerUserId: mongoProposal.user_id
          ? idMap.get(mongoProposal.user_id.toString())
          : null,
        ownerTeamId: mongoProposal.team_id
          ? idMap.get(mongoProposal.team_id.toString())
          : null,
        winnerId: mongoProposal.winner_id
          ? idMap.get(mongoProposal.winner_id.toString())
          : null,
      },
    });
    idMap.set(mongoProposal._id.toString(), prismaProposal.id);

    // Crea ProposalMovie per ogni movie
    if (mongoProposal.movie_ids && Array.isArray(mongoProposal.movie_ids)) {
      for (const movieId of mongoProposal.movie_ids) {
        const prismaMovieId = idMap.get(movieId.toString());
        if (prismaMovieId) {
          await prisma.proposalMovie.create({
            data: {
              proposalId: prismaProposal.id,
              movieId: prismaMovieId,
            },
          });
        }
      }
    }
  }
  console.log(`   ✓ Importati ${data.proposals.length} proposals`);

  // 7. Importa ProposalVotes
  console.log("\n7️⃣ Importazione ProposalVotes...");
  let voteCount = 0;
  for (const mongoVote of data.proposalVotes) {
    console.log(
      `   Importando proposal vote ${++voteCount}/${data.proposalVotes.length}...`,
    );
    try {
      // Mappa gli ID MongoDB in movieSelection ai nuovi ID Prisma
      const movieSelection = mongoVote.movie_selection || {};
      const mappedMovieSelection: Record<string, number> = {};

      for (const [mongoMovieId, rank] of Object.entries(movieSelection)) {
        const prismaMovieId = idMap.get(mongoMovieId);
        if (prismaMovieId) {
          mappedMovieSelection[prismaMovieId] = rank as number;
        }
      }

      await prisma.proposalVote.create({
        data: {
          proposalId: idMap.get(mongoVote.proposal_id.toString())!,
          userId: idMap.get(mongoVote.user_id.toString())!,
          movieSelection: mappedMovieSelection,
        },
      });
    } catch (error) {
      console.error(
        `   ❌ Errore importando proposal vote ${JSON.stringify(mongoVote)}:`,
        error,
      );
    }
  }
  console.log(`   ✓ Importati ${data.proposalVotes.length} proposal votes`);

  // 8. Importa MovieVotes
  console.log("\n8️⃣ Importazione MovieVotes...");
  let movieVoteCount = 0;
  for (const mongoVote of data.movieVotes) {
    console.log(
      `   Importando movie vote ${++movieVoteCount}/${data.movieVotes.length}...`,
    );

    // movieRoundRankingId sarà collegato dopo aver importato i MovieRoundRankings
    // Per ora lo salviamo senza questo campo
    await prisma.movieVote.create({
      data: {
        rating: mongoVote.rating,
        roundId: idMap.get(mongoVote.round_id.toString())!,
        userId: idMap.get(mongoVote.user_id.toString())!,
        movieId: idMap.get(mongoVote.movie_id.toString())!,
        movieRoundRankingId: null, // Sarà aggiornato dopo
      },
    });
  }
  console.log(`   ✓ Importati ${data.movieVotes.length} movie votes`);

  // 9. Importa MovieRoundRankings
  console.log("\n9️⃣ Importazione MovieRoundRankings...");
  let rankingCount = 0;
  for (const mongoRanking of data.movieRoundRankings) {
    console.log(
      `   Importando movie round ranking ${++rankingCount}/${data.movieRoundRankings.length}...`,
    );
    const prismaRanking = await prisma.movieRoundRanking.create({
      data: {
        averageRating: mongoRanking.average_rating,
        roundWinner: mongoRanking.round_winner || false,
        roundId: idMap.get(mongoRanking.round_id.toString())!,
        movieId: idMap.get(mongoRanking.movie_id.toString())!,
        userId: mongoRanking.user_id
          ? idMap.get(mongoRanking.user_id.toString())
          : null,
        teamId: mongoRanking.team_id
          ? idMap.get(mongoRanking.team_id.toString())
          : null,
      },
    });
    idMap.set(mongoRanking._id.toString(), prismaRanking.id);
  }
  console.log(
    `   ✓ Importati ${data.movieRoundRankings.length} movie round rankings`,
  );

  // 9b. Aggiorna MovieVotes con movieRoundRankingId
  console.log("\n9️⃣b Aggiornamento MovieVotes con movieRoundRankingId...");
  let updatedVotes = 0;
  for (const mongoVote of data.movieVotes) {
    if (mongoVote.movie_round_ranking_id) {
      const movieRoundRankingId = idMap.get(
        mongoVote.movie_round_ranking_id.toString(),
      );
      if (movieRoundRankingId) {
        // Trova il voto corrispondente
        const roundId = idMap.get(mongoVote.round_id.toString())!;
        const userId = idMap.get(mongoVote.user_id.toString())!;
        const movieId = idMap.get(mongoVote.movie_id.toString())!;

        await prisma.movieVote.updateMany({
          where: {
            roundId,
            userId,
            movieId,
          },
          data: {
            movieRoundRankingId,
          },
        });
        updatedVotes++;
      }
    }
  }
  console.log(`   ✓ Aggiornati ${updatedVotes} movie votes con ranking ID`);

  // 10. Importa UserRankings
  console.log("\n🔟 Importazione UserRankings...");
  let userRankingCount = 0;
  for (const mongoRanking of data.userRankings) {
    console.log(
      `   Importando user ranking ${++userRankingCount}/${data.userRankings.length}...`,
    );
    const prismaRanking = await prisma.userRanking.create({
      data: {
        userId: idMap.get(mongoRanking.user_id.toString())!,
        cineforumId: cineforum.id,
        averageRating: mongoRanking.average_rating,
        averageImdbRating: mongoRanking.average_imdb_rating,
        averageTmdbRating: mongoRanking.average_tmdb_rating,
        averageRotoRating: mongoRanking.average_roto_rating,
        averageMetaRating: mongoRanking.average_meta_rating,
      },
    });
    idMap.set(mongoRanking._id.toString(), prismaRanking.id);

    // Crea UserRankingMovieRoundRanking
    if (
      mongoRanking.movie_round_ranking_ids &&
      Array.isArray(mongoRanking.movie_round_ranking_ids)
    ) {
      for (const mrrId of mongoRanking.movie_round_ranking_ids) {
        const prismaMrrId = idMap.get(mrrId.toString());
        if (prismaMrrId) {
          await prisma.userRankingMovieRoundRanking.create({
            data: {
              userRankingId: prismaRanking.id,
              movieRoundRankingId: prismaMrrId,
            },
          });
        }
      }
    }
  }
  console.log(`   ✓ Importati ${data.userRankings.length} user rankings`);

  console.log("\n🎉 Migrazione completata con successo!");
}

importData()
  .catch((error) => {
    console.error("\n❌ Errore durante la migrazione:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
