const { MongoClient } = require("mongodb");
const fs = require("fs");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI non definito in .env");
  process.exit(1);
}

async function exportData() {
  console.log("📤 Connessione a MongoDB...");
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db();

  console.log("📤 Esportazione dati da MongoDB...\n");

  const data = {
    users: await db.collection("users").find({}).toArray(),
    movies: await db.collection("movies").find({}).toArray(),
    rounds: await db.collection("rounds").find({}).toArray(),
    teams: await db.collection("teams").find({}).toArray(),
    proposals: await db.collection("proposals").find({}).toArray(),
    proposalVotes: await db.collection("proposal_votes").find({}).toArray(),
    movieVotes: await db.collection("movie_votes").find({}).toArray(),
    movieRoundRankings: await db
      .collection("movie_round_rankings")
      .find({})
      .toArray(),
    userRankings: await db.collection("user_rankings").find({}).toArray(),
  };

  // Salva in JSON
  const outputPath = "data/mongodb-export.json";
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Esportati:`);
  console.log(`   - ${data.users.length} users`);
  console.log(`   - ${data.movies.length} movies`);
  console.log(`   - ${data.rounds.length} rounds`);
  console.log(`   - ${data.teams.length} teams`);
  console.log(`   - ${data.proposals.length} proposals`);
  console.log(`   - ${data.proposalVotes.length} proposal votes`);
  console.log(`   - ${data.movieVotes.length} movie votes`);
  console.log(`   - ${data.movieRoundRankings.length} movie round rankings`);
  console.log(`   - ${data.userRankings.length} user rankings`);
  console.log(`\n💾 File salvato: ${outputPath}`);

  await client.close();
}

exportData().catch((error) => {
  console.error("❌ Errore durante l'esportazione:", error);
  process.exit(1);
});
