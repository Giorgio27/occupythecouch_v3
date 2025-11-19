export default function ResultsPanel({
  ranking,
  proposal,
}: {
  ranking: any;
  proposal: any;
}) {
  return (
    <div className="space-y-2">
      {ranking.sorted_movies.map((m: any) => (
        <div key={m.id} className="rounded-lg border p-3">
          <div className="font-medium">
            {m.title} {m.year ? `(${m.year})` : ""}
          </div>
          <div className="text-xs text-muted-foreground">
            rank: {m.proposal_rank}
          </div>
        </div>
      ))}

      <details className="pt-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Peek other votes
        </summary>
        <div className="mt-2 space-y-3">
          {ranking.votes.map((v: any) => (
            <div key={v.id} className="rounded-md border p-3">
              <div className="mb-2 text-sm font-medium">User: {v.user.id}</div>
              <table className="w-full text-sm">
                <tbody>
                  {Object.keys(v.movie_selection)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((rk) => (
                      <tr key={rk}>
                        <td className="w-10 align-top font-medium">{rk}°</td>
                        <td className="align-top">
                          {(v.movie_selection[rk] as string[])
                            .map(
                              (id) =>
                                proposal.movies.find((mm: any) => mm.id === id)
                                  ?.title
                            )
                            .filter(Boolean)
                            .map((t, i) => (
                              <div
                                key={i}
                                className="rounded bg-muted px-2 py-1"
                              >
                                {t}
                              </div>
                            ))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
