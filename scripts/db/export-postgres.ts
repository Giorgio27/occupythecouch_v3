import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("📤 Connessione a PostgreSQL...");
  console.log("📤 Esportazione dati da PostgreSQL...\n");

  // Ordine "logico" (segue le dipendenze), utile per un eventuale re-import.
  const data = {
    users: await prisma.user.findMany(),
    accounts: await prisma.account.findMany(),
    sessions: await prisma.session.findMany(),
    verificationTokens: await prisma.verificationToken.findMany(),
    cineforums: await prisma.cineforum.findMany(),
    memberships: await prisma.membership.findMany(),
    movies: await prisma.movie.findMany(),
    rounds: await prisma.round.findMany(),
    teams: await prisma.team.findMany(),
    teamUsers: await prisma.teamUser.findMany(),
    proposals: await prisma.proposal.findMany(),
    proposalMovies: await prisma.proposalMovie.findMany(),
    proposalVotes: await prisma.proposalVote.findMany(),
    movieVotes: await prisma.movieVote.findMany(),
    movieRoundRankings: await prisma.movieRoundRanking.findMany(),
    userRankings: await prisma.userRanking.findMany(),
    userRankingMovieRoundRankings:
      await prisma.userRankingMovieRoundRanking.findMany(),
  };

  // Salva in JSON con timestamp per non sovrascrivere i backup precedenti.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = "data";
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `postgres-export-${stamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Esportati:`);
  console.log(`   - ${data.users.length} users`);
  console.log(`   - ${data.accounts.length} accounts`);
  console.log(`   - ${data.sessions.length} sessions`);
  console.log(`   - ${data.verificationTokens.length} verification tokens`);
  console.log(`   - ${data.cineforums.length} cineforums`);
  console.log(`   - ${data.memberships.length} memberships`);
  console.log(`   - ${data.movies.length} movies`);
  console.log(`   - ${data.rounds.length} rounds`);
  console.log(`   - ${data.teams.length} teams`);
  console.log(`   - ${data.teamUsers.length} team users`);
  console.log(`   - ${data.proposals.length} proposals`);
  console.log(`   - ${data.proposalMovies.length} proposal movies`);
  console.log(`   - ${data.proposalVotes.length} proposal votes`);
  console.log(`   - ${data.movieVotes.length} movie votes`);
  console.log(`   - ${data.movieRoundRankings.length} movie round rankings`);
  console.log(`   - ${data.userRankings.length} user rankings`);
  console.log(
    `   - ${data.userRankingMovieRoundRankings.length} user ranking <-> movie round ranking`
  );
  console.log(`\n💾 File salvato: ${outputPath}`);
}

exportData()
  .catch((error) => {
    console.error("❌ Errore durante l'esportazione:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
