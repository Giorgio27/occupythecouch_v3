import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🧹 Pulizia database...");

  try {
    // Ordine inverso per rispettare foreign keys
    await prisma.userRankingMovieRoundRanking.deleteMany();
    console.log("  ✓ UserRankingMovieRoundRanking");

    await prisma.userRanking.deleteMany();
    console.log("  ✓ UserRanking");

    await prisma.movieRoundRanking.deleteMany();
    console.log("  ✓ MovieRoundRanking");

    await prisma.movieVote.deleteMany();
    console.log("  ✓ MovieVote");

    await prisma.proposalVote.deleteMany();
    console.log("  ✓ ProposalVote");

    await prisma.proposalMovie.deleteMany();
    console.log("  ✓ ProposalMovie");

    await prisma.proposal.deleteMany();
    console.log("  ✓ Proposal");

    await prisma.teamUser.deleteMany();
    console.log("  ✓ TeamUser");

    await prisma.team.deleteMany();
    console.log("  ✓ Team");

    await prisma.round.deleteMany();
    console.log("  ✓ Round");

    await prisma.movie.deleteMany();
    console.log("  ✓ Movie");

    await prisma.membership.deleteMany();
    console.log("  ✓ Membership");

    await prisma.cineforum.deleteMany();
    console.log("  ✓ Cineforum");

    await prisma.session.deleteMany();
    console.log("  ✓ Session");

    await prisma.account.deleteMany();
    console.log("  ✓ Account");

    await prisma.user.deleteMany();
    console.log("  ✓ User");

    await prisma.verificationToken.deleteMany();
    console.log("  ✓ VerificationToken");

    console.log("\n✅ Database pulito con successo!");
  } catch (error) {
    console.error("\n❌ Errore durante la pulizia:", error);
    process.exit(1);
  }
}

clearDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
