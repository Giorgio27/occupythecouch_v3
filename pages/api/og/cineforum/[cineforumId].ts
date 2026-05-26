import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getCineforumPageMeta } from "@/lib/server/meta";
import type { SupportedLocale } from "@/lib/server/get-locale";

// Valid page keys — must match PageMetaKey in lib/server/meta.ts
const PAGE_PATHS: Record<string, string> = {
  proposal: "/cineforum/{id}/proposal",
  movies: "/cineforum/{id}/movies",
  oscars: "/cineforum/{id}/oscars",
  timeline: "/cineforum/{id}/rankings/timeline",
  stats: "/cineforum/{id}/stats/users",
};

type PageKey = keyof typeof PAGE_PATHS;

/**
 * Public OG preview endpoint for all cineforum pages.
 *
 * No authentication required — only exposes the cineforum name.
 * Returns a minimal HTML page with Open Graph meta tags so that
 * Telegram (and other link-preview crawlers) can generate a rich preview
 * without hitting the auth wall.
 * Browsers are redirected to the real cineforum page via meta-refresh.
 *
 * Query params:
 *   page  — one of: proposal (default), movies, oscars, timeline, stats
 *
 * Usage in Telegram notifications:
 *   https://occupythecouch.app/api/og/cineforum/<cineforumId>?page=proposal
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const { cineforumId, page } = req.query;
  if (typeof cineforumId !== "string") {
    res.status(400).end();
    return;
  }

  const pageKey: PageKey =
    typeof page === "string" && page in PAGE_PATHS ? page : "proposal";

  const cineforum = await prisma.cineforum.findUnique({
    where: { id: cineforumId },
    select: { name: true, locale: true },
  });

  if (!cineforum) {
    res.status(404).end();
    return;
  }

  const locale = (cineforum.locale ?? "it") as SupportedLocale;
  const { title, description } = getCineforumPageMeta(
    pageKey as Parameters<typeof getCineforumPageMeta>[0],
    locale,
    cineforum.name,
  );

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://occupythecouch.app";
  const pagePath = PAGE_PATHS[pageKey].replace("{id}", cineforumId);
  const pageUrl = `${BASE_URL}${pagePath}`;
  const imageUrl = `${BASE_URL}/og-image.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OccupyTheCouch" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <p><a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache for 5 minutes — cineforum names rarely change
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(html);
}

/** Escapes characters that are unsafe inside HTML attribute values and text. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
