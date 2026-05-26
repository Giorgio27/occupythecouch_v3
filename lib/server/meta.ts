import type { SupportedLocale } from "@/lib/server/get-locale";

type PageMetaKey = "proposal" | "movies" | "oscars" | "timeline" | "stats";

type MetaStrings = {
  title: string;
  description: string;
};

const meta: Record<SupportedLocale, { home: MetaStrings; pages: Record<PageMetaKey, MetaStrings> }> = {
  it: {
    home: {
      title: "CineForum - Scegli film con gli amici",
      description:
        "Crea un round, invita gli amici a proporre film, votate insieme. Il migliore vince. Niente discussioni, solo cinema.",
    },
    pages: {
      proposal: {
        title: "{{cineforumName}} — CineForum",
        description: 'Proponi film, vota e scegli insieme cosa guardare nel cineforum "{{cineforumName}}".',
      },
      movies: {
        title: "Film — {{cineforumName}} · CineForum",
        description: 'Tutti i film visti nel cineforum "{{cineforumName}}" con statistiche e voti.',
      },
      oscars: {
        title: "Oscar — {{cineforumName}} · CineForum",
        description: 'I premi Oscar del cineforum "{{cineforumName}}": i migliori film votati dal gruppo.',
      },
      timeline: {
        title: "Timeline — {{cineforumName}} · CineForum",
        description: 'Tutti i film del cineforum "{{cineforumName}}" ordinati per anno di uscita.',
      },
      stats: {
        title: "Statistiche — {{cineforumName}} · CineForum",
        description: 'Le statistiche dei membri del cineforum "{{cineforumName}}": voti, preferenze e profili.',
      },
    },
  },
  en: {
    home: {
      title: "CineForum - Choose movies with friends",
      description:
        "Create a round, invite friends to propose movies, vote together. The best one wins. No arguments, just cinema.",
    },
    pages: {
      proposal: {
        title: "{{cineforumName}} — CineForum",
        description: 'Propose movies, vote and choose together what to watch in the "{{cineforumName}}" cineforum.',
      },
      movies: {
        title: "Movies — {{cineforumName}} · CineForum",
        description: 'All movies watched in the "{{cineforumName}}" cineforum with stats and ratings.',
      },
      oscars: {
        title: "Oscars — {{cineforumName}} · CineForum",
        description: 'The Oscar awards of the "{{cineforumName}}" cineforum: the best movies voted by the group.',
      },
      timeline: {
        title: "Timeline — {{cineforumName}} · CineForum",
        description: 'All movies in the "{{cineforumName}}" cineforum sorted by release year.',
      },
      stats: {
        title: "Stats — {{cineforumName}} · CineForum",
        description: 'Member statistics for the "{{cineforumName}}" cineforum: ratings, preferences and profiles.',
      },
    },
  },
};

/**
 * Returns localized title and description for the home/landing page.
 *
 * @param locale - The current locale
 */
export function getHomeMeta(locale: SupportedLocale): MetaStrings {
  return meta[locale].home;
}

/**
 * Returns localized title and description for a cineforum page,
 * with {{cineforumName}} replaced by the actual name.
 *
 * @param page - The page key
 * @param locale - The current locale
 * @param cineforumName - The cineforum name to interpolate
 */
export function getCineforumPageMeta(
  page: PageMetaKey,
  locale: SupportedLocale,
  cineforumName: string,
): MetaStrings {
  const strings = meta[locale].pages[page];
  return {
    title: strings.title.replace("{{cineforumName}}", cineforumName),
    description: strings.description.replace("{{cineforumName}}", cineforumName),
  };
}
