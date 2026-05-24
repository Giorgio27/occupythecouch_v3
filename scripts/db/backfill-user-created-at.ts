/**
 * Backfill user createdAt + membership createdAt
 *
 * Per ogni utente, trova la proposal più vecchia (per campo `date`) tra:
 *   1. Proposal in cui è owner (ownerUserId)
 *   2. Proposal a cui ha votato direttamente (ProposalVote)
 *   3. Proposal che contiene un film votato dall'utente nello stesso round (MovieVote)
 *
 * Se quella data è precedente alla sua `createdAt`, aggiorna:
 *   - User.createdAt
 *   - Membership.createdAt per ogni cineforum in cui l'utente è membro
 *     (usando la data più vecchia di partecipazione in quel cineforum specifico)
 *
 * Run:
 *   npx tsx scripts/db/backfill-user-created-at.ts
 *   DRY_RUN=false npx tsx scripts/db/backfill-user-created-at.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== "false";

function fmt(d: Date) {
  return d.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function daysDiff(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

interface UserReport {
  label: string;
  currentCreatedAt: Date;
  newCreatedAt: Date | null;
  source: string | null;
  title: string | null;
  membershipUpdates: { cineforumId: string; from: Date; to: Date }[];
}

/** Trova la proposal più vecchia con data in un cineforum per un utente. */
async function findOldestParticipation(
  userId: string,
  cineforumId?: string,
): Promise<{ date: Date; title: string; source: string } | null> {
  const cineforumFilter = cineforumId ? { cineforumId } : {};
  const candidates: { date: Date; title: string; source: string }[] = [];

  // Fonte 1: proposta owned dall'utente
  const oldestOwned = await prisma.proposal.findFirst({
    where: { ownerUserId: userId, date: { not: null }, ...cineforumFilter },
    orderBy: { date: "asc" },
    select: { date: true, title: true },
  });
  if (oldestOwned?.date) {
    candidates.push({ date: oldestOwned.date, title: oldestOwned.title, source: "owned" });
  }

  // Fonte 2: ProposalVote
  const oldestProposalVote = await prisma.proposalVote.findFirst({
    where: {
      userId,
      proposal: { date: { not: null }, ...cineforumFilter },
    },
    orderBy: { proposal: { date: "asc" } },
    include: { proposal: { select: { date: true, title: true } } },
  });
  if (oldestProposalVote?.proposal.date) {
    candidates.push({
      date: oldestProposalVote.proposal.date,
      title: oldestProposalVote.proposal.title,
      source: "proposal-vote",
    });
  }

  // Fonte 3: MovieVote (stesso round + stesso film della proposta)
  const userMovieVotes = await prisma.movieVote.findMany({
    where: {
      userId,
      ...(cineforumId ? { round: { cineforumId } } : {}),
    },
    select: { movieId: true, roundId: true },
  });
  if (userMovieVotes.length > 0) {
    const found = await prisma.proposal.findFirst({
      where: {
        date: { not: null },
        ...cineforumFilter,
        OR: userMovieVotes.map((v) => ({
          roundId: v.roundId,
          movies: { some: { movieId: v.movieId } },
        })),
      },
      orderBy: { date: "asc" },
      select: { date: true, title: true },
    });
    if (found?.date) {
      candidates.push({ date: found.date, title: found.title, source: "movie-vote" });
    }
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.date < b.date ? a : b));
}

async function main() {
  console.log("=".repeat(60));
  console.log(`  Backfill user createdAt + membership createdAt`);
  console.log(`  Modalità: ${DRY_RUN ? "DRY RUN (nessuna modifica)" : "⚠️  LIVE — scrittura su DB"}`);
  console.log("=".repeat(60));

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      memberships: { select: { id: true, cineforumId: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nUtenti trovati: ${users.length}\n`);

  let usersUpdated = 0;
  let membershipsUpdated = 0;
  let skippedNoProposals = 0;
  let skippedAlreadyOk = 0;
  let index = 0;

  const dryRunReport: UserReport[] = [];

  for (const user of users) {
    index++;
    const label = user.email ?? user.name ?? user.id;
    console.log(`[${index}/${users.length}] ${label}  (createdAt: ${fmt(user.createdAt)})`);

    // --- Aggiornamento User.createdAt (global, tutti i cineforum) ---
    const globalOldest = await findOldestParticipation(user.id);

    if (!globalOldest) {
      console.log(`  ⏭  skip — nessuna proposal con data trovata\n`);
      skippedNoProposals++;
      if (DRY_RUN) dryRunReport.push({ label, currentCreatedAt: user.createdAt, newCreatedAt: null, source: null, title: null, membershipUpdates: [] });
      continue;
    }

    console.log(`  → [best]   "${globalOldest.title}"  ${fmt(globalOldest.date)}  [fonte: ${globalOldest.source}]`);

    let userWillUpdate = false;
    if (globalOldest.date < user.createdAt) {
      const diff = daysDiff(user.createdAt, globalOldest.date);
      console.log(`  ✏️  User.createdAt: ${fmt(user.createdAt)} → ${fmt(globalOldest.date)}  (${diff}gg prima)`);
      if (!DRY_RUN) {
        await prisma.user.update({ where: { id: user.id }, data: { createdAt: globalOldest.date } });
        console.log(`  ✅ User salvato`);
      } else {
        console.log(`  [dry run — nessuna scrittura]`);
      }
      userWillUpdate = true;
      usersUpdated++;
    } else {
      console.log(`  ⏭  User.createdAt già ok`);
      skippedAlreadyOk++;
    }

    // --- Aggiornamento Membership.createdAt (per-cineforum) ---
    const membershipUpdates: { cineforumId: string; from: Date; to: Date }[] = [];

    for (const membership of user.memberships) {
      const oldest = await findOldestParticipation(user.id, membership.cineforumId);

      if (!oldest) continue;

      if (oldest.date < membership.createdAt) {
        const diff = daysDiff(membership.createdAt, oldest.date);
        console.log(
          `  ✏️  Membership [${membership.cineforumId}]: ${fmt(membership.createdAt)} → ${fmt(oldest.date)}  (${diff}gg prima)  [fonte: ${oldest.source}] "${oldest.title}"`
        );
        if (!DRY_RUN) {
          await prisma.membership.update({
            where: { id: membership.id },
            data: { createdAt: oldest.date },
          });
          console.log(`  ✅ Membership salvata`);
          membershipsUpdated++;
        } else {
          console.log(`  [dry run — nessuna scrittura]`);
          membershipUpdates.push({ cineforumId: membership.cineforumId, from: membership.createdAt, to: oldest.date });
          membershipsUpdated++;
        }
      } else {
        console.log(`  ⏭  Membership [${membership.cineforumId}] già ok`);
      }
    }

    if (DRY_RUN) {
      dryRunReport.push({
        label,
        currentCreatedAt: user.createdAt,
        newCreatedAt: userWillUpdate ? globalOldest.date : null,
        source: userWillUpdate ? globalOldest.source : null,
        title: userWillUpdate ? globalOldest.title : null,
        membershipUpdates,
      });
    }

    console.log();
  }

  console.log("=".repeat(60));
  console.log(`  Riepilogo`);
  console.log(`  User aggiornati:              ${usersUpdated}`);
  console.log(`  Membership aggiornate:        ${membershipsUpdated}`);
  console.log(`  Saltati (nessuna proposal):   ${skippedNoProposals}`);
  console.log(`  Saltati (già ok):             ${skippedAlreadyOk}`);
  console.log("=".repeat(60));

  if (DRY_RUN) {
    const toUpdate = dryRunReport.filter((r) => r.newCreatedAt !== null || r.membershipUpdates.length > 0);
    const noChange = dryRunReport.filter((r) => r.newCreatedAt === null && r.membershipUpdates.length === 0);

    console.log("\n" + "=".repeat(60));
    console.log(`  REPORT DRY RUN — Utenti con aggiornamenti (${toUpdate.length})`);
    console.log("=".repeat(60));

    if (toUpdate.length === 0) {
      console.log("  Nessun utente da aggiornare.");
    } else {
      for (const r of toUpdate) {
        console.log(`  ${r.label}`);
        if (r.newCreatedAt) {
          const diff = daysDiff(r.currentCreatedAt, r.newCreatedAt);
          console.log(`    User:       ${fmt(r.currentCreatedAt)} → ${fmt(r.newCreatedAt)}  (${diff}gg)  [${r.source}] "${r.title}"`);
        }
        for (const m of r.membershipUpdates) {
          const diff = daysDiff(m.from, m.to);
          console.log(`    Membership [${m.cineforumId}]: ${fmt(m.from)} → ${fmt(m.to)}  (${diff}gg)`);
        }
      }
    }

    console.log(`\n  Utenti senza aggiornamento (${noChange.length}):`);
    for (const r of noChange) {
      console.log(`  - ${r.label}  (${fmt(r.currentCreatedAt)})`);
    }

    console.log("\n  ⚠️  Riesegui con DRY_RUN=false per applicare le modifiche");
    console.log("=".repeat(60));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
