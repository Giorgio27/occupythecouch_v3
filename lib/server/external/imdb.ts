export async function imdbSuggest(q: string) {
  const first = q.trim().toLowerCase().replace(/'/g, "")[0] ?? "a";
  const url = `https://v2.sg.media-imdb.com/suggests/${first}/${encodeURIComponent(
    q.trim().toLowerCase().replace(/'/g, "")
  )}.json`;

  const text = await fetch(url).then((r) => r.text());
  const jsonStr = text.slice(text.indexOf("(") + 1, text.lastIndexOf(")"));
  const json = JSON.parse(jsonStr);
  const results = (json?.d || []) as any[];

  const movies = results
    .filter((m) => ["feature", "TV movie", "TV episode"].includes(m.q) && m.y)
    .map((m) => {
      const start = m.i?.[0] as string | undefined;
      const small = start?.replace("._V1_.", "._V1._SX40_CR0,0,40,54_.");
      const medium = start?.replace("._V1_.", "._V1_UY268_CR7,0,182,268_AL_.");
      return { id: m.id, l: m.l, y: m.y, s: m.s, q: m.q, i: [small, medium] };
    });

  return movies;
}
