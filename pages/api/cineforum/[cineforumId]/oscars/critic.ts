import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { askAI } from "@/lib/server/ai/critic";

const SYSTEM_IT = `Sei un critico cinematografico cinico, tagliente e snob, ma onesto e competente.
Ti do come un piccolo cineforum amatoriale ha votato i film di un ciclo (voti su scala 1-5, con a fianco i voti delle piattaforme normalizzati su 5).
Commenta i LORO GUSTI con sarcasmo pungente: dove hanno preso una cantonata clamorosa, dove per una volta ci hanno visto giusto, cosa rivela di loro questa selezione.
Regole: massimo ~130 parole, in italiano, tono da stroncatura ma con verità dentro, cita un paio di film specifici. Niente elenco puntato, scrivi un paragrafo. Chiudi con una riga secca "Voto alla vostra serata: X/10" (puoi usare mezzi voti).`;

const SYSTEM_EN = `You are a cynical, sharp, snobbish film critic — but honest and competent.
I give you how a small amateur film club voted on a cycle's movies (ratings on a 1-5 scale, with the platforms' scores normalized to 5 alongside).
Roast THEIR TASTE with biting sarcasm: where they blundered spectacularly, where for once they got it right, what this selection reveals about them.
Rules: max ~130 words, in English, a scathing tone but with real truth in it, cite a couple of specific films. No bullet list, write one paragraph. End with a curt line "Your screening's score: X/10" (half points allowed).`;

const DIV = 2; // platform /10 → /5

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ text: string } | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { cineforumId, roundId } = req.query as {
    cineforumId: string;
    roundId?: string;
  };
  if (typeof roundId !== "string" || !roundId) {
    return res.status(400).json({ error: "Missing roundId" });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const [cineforum, round, proposals, rankings] = await Promise.all([
      prisma.cineforum.findUnique({
        where: { id: cineforumId },
        select: { locale: true },
      }),
      prisma.round.findUnique({ where: { id: roundId }, select: { name: true } }),
      prisma.proposal.findMany({
        where: { cineforumId, roundId, winnerId: { not: null } },
        select: {
          winnerId: true,
          winner: {
            select: {
              id: true,
              title: true,
              year: true,
              director: true,
              imdbRating: true,
              voteAverage: true,
              tomatometer: true,
              metascore: true,
            },
          },
        },
      }),
      prisma.movieRoundRanking.findMany({
        where: { roundId, averageRating: { not: null } },
        select: { movieId: true, averageRating: true },
      }),
    ]);

    const en = cineforum?.locale === "en";

    const avg = new Map<string, number>();
    for (const r of rankings)
      if (r.averageRating != null) avg.set(r.movieId, r.averageRating);

    const lines = proposals
      .filter((p) => p.winner && avg.has(p.winnerId!))
      .map((p) => {
        const m = p.winner!;
        const plat = [m.imdbRating, m.voteAverage, m.tomatometer, m.metascore]
          .filter((v): v is number => v != null)
          .map((v) => v / DIV);
        const platAvg =
          plat.length > 0
            ? (plat.reduce((s, v) => s + v, 0) / plat.length).toFixed(1)
            : null;
        const platStr = platAvg
          ? en
            ? ` (platforms ~${platAvg})`
            : ` (piattaforme ~${platAvg})`
          : "";
        const by = m.director ? (en ? `, by ${m.director}` : `, di ${m.director}`) : "";
        const rate = en ? "club rating" : "voto club";
        return `- ${m.title}${m.year ? ` (${m.year})` : ""}${by}: ${rate} ${avg.get(m.id)!.toFixed(2)}${platStr}`;
      })
      .sort();

    if (lines.length === 0) {
      return res.status(200).json({ text: "" });
    }

    const name = round?.name ?? "";
    const user = en
      ? `Cycle "${name}". Here's how the club voted on the films:\n${lines.join("\n")}`
      : `Ciclo "${name}". Ecco come il cineforum ha votato i film:\n${lines.join("\n")}`;

    const text = await askAI(en ? SYSTEM_EN : SYSTEM_IT, user);
    return res.status(200).json({ text: text || "" });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/oscars/critic:",
      error,
    );
    return res.status(502).json({ error: "AI provider error" });
  }
}
