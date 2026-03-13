import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type CountryData = [string, number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { cineforumId } = req.query;

    if (typeof cineforumId !== "string") {
      return res.status(400).json({ error: "Invalid cineforumId" });
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_cineforumId: {
          userId: session.user.id,
          cineforumId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Not a member of this cineforum" });
    }

    // Fetch all movie round rankings for this cineforum with movie details
    const rankings = await prisma.movieRoundRanking.findMany({
      where: {
        round: {
          cineforumId,
        },
      },
      include: {
        movie: {
          select: {
            productionCountries: true,
          },
        },
      },
    });

    // Count movies by country
    const countriesMap: Record<string, number> = {};

    for (const ranking of rankings) {
      const countries = ranking.movie.productionCountries;

      // productionCountries is stored as JSON array
      if (countries && Array.isArray(countries)) {
        for (const country of countries as any[]) {
          const countryName = country.name || country.iso_3166_1;
          if (countryName) {
            countriesMap[countryName] = (countriesMap[countryName] || 0) + 1;
          }
        }
      }
    }

    // Convert to array of tuples and sort by count descending
    const body: CountryData[] = Object.entries(countriesMap)
      .map(([name, count]) => [name, count] as CountryData)
      .sort((a, b) => b[1] - a[1]);

    return res.status(200).json({
      body,
      status: "completed",
    });
  } catch (error) {
    console.error("Error fetching countries rankings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
