export async function omdbEnrichMovie(imdbId: string) {
  const key = process.env.OMDB_API_KEY!;
  const json = await fetch(
    `http://www.omdbapi.com/?apikey=${key}&i=${encodeURIComponent(imdbId)}`
  ).then((r) => r.json());

  let imdb_rating: number | null = null;
  let tomatometer: number | null = null;
  let metascore: number | null = null;

  for (const rating of json?.Ratings || []) {
    if (rating.Source === "Internet Movie Database") {
      imdb_rating = parseFloat((rating.Value as string).replace("/10", ""));
    } else if (rating.Source === "Rotten Tomatoes") {
      tomatometer = parseFloat((rating.Value as string).replace("%", "")) / 10;
    } else if (rating.Source === "Metacritic") {
      metascore = parseFloat((rating.Value as string).replace("/100", "")) / 10;
    }
  }
  return { imdb_rating, tomatometer, metascore };
}
