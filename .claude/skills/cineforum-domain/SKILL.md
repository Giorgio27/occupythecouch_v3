---
name: cineforum-domain
description: How OccupyTheCouch v3 works as a product — cineforum, rounds, proposals, Schulze voting, the Oscars rating vote, round close, MovieRoundRanking/UserRanking, F1 positions, weighted scores, consensus, the Oscar oracle and Telegram notifications — with the file that owns each piece. Use before changing or explaining anything about rounds, proposals, votes, rankings, stats, Oscars or notifications.
---

# Cineforum domain

## Entities (prisma/schema.prisma)

| Model | Meaning |
| --- | --- |
| `Cineforum` | A club. Everything except `Movie` is scoped by `cineforumId`. Holds Telegram bot token/chat id and `locale` (it/en) for Telegram texts. |
| `Membership` | User ↔ Cineforum with `role` `MEMBER`/`ADMIN`/`OWNER` and `disabled`. "Active members" = `disabled: false`. |
| `Movie` | **Global**, shared across cineforums. Metadata from TMDB/OMDB/IMDb; external ratings stored on a /10 scale (`voteAverage` TMDB, `imdbRating`, `tomatometer`, `metascore`). Also TV episodes (`showId`, season, episode). |
| `Round` | A season-like batch inside a cineforum. `closed`, `oscarable` (true once closed and ranked), optional `chooserId`. |
| `Team` / `TeamUser` | Group of users that can own proposals; optionally tied to a round. |
| `Proposal` | One evening's pick: a set of candidate movies (`ProposalMovie`) offered by a user (`ownerUserId`) **or** a team (`ownerTeamId`). Has `closed`, `showResults`, `winnerId`. |
| `ProposalVote` | One per user per proposal. `movieSelection` JSON: rank → movie ids, ties allowed, e.g. `{"1": ["m1"], "2": ["m2","m3"]}`. |
| `MovieVote` | The **Oscars** vote: a 0–5 rating per (round, movie, user) for the winner movies of the round. |
| `MovieRoundRanking` (MRR) | Created at round close: per (round, winner movie, owner) the `averageRating` and `roundWinner` flag; links its `MovieVote`s. |
| `UserRanking` | Per (user, cineforum) running averages: `averageRating` of the MRRs they own, plus averages of the external ratings normalized to /5. Linked to MRRs via `UserRankingMovieRoundRanking`. |

## Lifecycle

1. **Round open.** Admin creates a round (`lib/server/rounds/index.ts#createRound`); creating a proposal with no open round auto-creates one (`ensureDefaultRound` in `pages/api/cineforum/proposals/index.ts`).
2. **Proposal.** A member/team proposes candidate movies → Telegram "new proposal" message.
3. **Proposal voting.** Members rank candidates (`pages/api/cineforum/proposals/votes/index.ts`, upsert per user) → Telegram message listing who's still missing.
   - Winner method: **Schulze** (`lib/server/ranking/schulze.ts`); ballots from `movieSelection`, unranked candidates share the bottom rank; ties broken by score then id.
   - Live ranking: `pages/api/cineforum/proposals/ranking/[proposalId].ts`; individual votes exposed only if `showResults`.
   - **Vote lock** (`lib/shared/ranking/voteLock.ts`): the leader is "clinched" when it beats every rival pairwise by more than the number of remaining voters. Sound but conservative: never a false "locked".
4. **Proposal close.** Admin closes it and picks `winnerId`, which must be one of its movies (`admin/proposals/[proposalId]/close.ts`; `reopen.ts` undoes it).
5. **Oscars vote.** Members rate each winner movie of the open round 0–5 (`[cineforumId]/oscars/vote.ts`; rejected once the round is closed). Admin preview of the live partial standings: `lib/server/oscars/index.ts`.
6. **Round close** (`lib/server/rounds/index.ts#closeRound`, route `rounds/[roundId]/close.ts`):
   - Precondition: every proposal closed, with a winner, and the winner has ≥1 MovieVote; otherwise throws a coded "not ready" error with details.
   - One interactive transaction: atomic claim `updateMany({ closed: false } → true)` (idempotency) → per proposal create MRR (average of its votes, `roundWinner` for the best average, ties allowed), connect votes, connect-or-create each owner's `UserRanking` (team proposals credit every team member) → `recomputeUserRankings` → set `oscarable: true`.
   - After commit: `notifyRoundClosed` sends results + full ranking ("pagellone") to Telegram.

## Derived stats (read-only, computed on request)

| What | File | How |
| --- | --- | --- |
| Movie rankings | `lib/server/rankings/movies.ts` | MRRs of closed rounds |
| Positions (F1) | `lib/server/rankings/positions.ts`, `positions-scoring.ts` | Within each closed round, proposals ranked by average rating (competition ranking: ties share a place); points `25,18,15,12,10,8,6,4,2,1`; team rows credit each member |
| Weighted score | `lib/server/rankings/weighted-score.ts` | Bayesian/IMDb shrinkage `(C·prior + sum) / (C + n)`; prior = group rate, C = mean n over keys with n > 0. Stops "many mediocre proposals" beating "few strong ones" |
| User rating weights | `lib/server/rankings/user-rating-weights.ts` | Same shrinkage on each member's average rating, computed over all rows (pagination-independent) |
| Consensus | `lib/server/rankings/consensus.ts` | Population std dev of member ratings per MRR; `MIN_VOTES = 3` |
| Genres, countries, directors, timeline, proposals stats | `lib/server/rankings/*` | Aggregations over closed rounds |
| User stats, similar users, love received | `lib/server/stats/*`, `[cineforumId]/stats/users/*` | Per-member analytics |
| Oscar oracle | `lib/server/oscars/oracle.ts` | Predicts the club's ranking of an open round **without reading its votes**: audience platform scores (IMDb/TMDB) + a shrunk proposer bias, calibrated leave-one-round-out; clamped to the club's range. Director/decade/genre weights tested and disabled |
| Round report ("pagellone") | `lib/server/oscars/round-report.ts` | Playful awards for a closed round; only awards whose thresholds are met |
| Voter participation | `lib/server/oscars/voter-participation.ts` | How many of the round's winners each active member rated |

## Invariants to preserve

- Rankings and stats count **closed rounds only** (`round: { closed: true }`); per-member leaderboards list **active members** (`disabled: false`).
- Ratings: MovieVote 0–5; external ratings stored /10, divided by 2 when compared with club ratings.
- A proposal has exactly one owner: user **or** team. Team ownership credits every team member everywhere (MRR, positions, UserRanking).
- Closing a round is one-way and must stay idempotent; there is no "reopen round" flow. Recomputing derived data must never require deleting real votes.
- Movies are global: never delete or mutate a `Movie` in a way that affects other cineforums.
- Telegram texts are built in the cineforum's `locale`, not the viewer's.

## External services (`lib/server/external/`)

`tmdb.ts`, `omdb.ts`, `imdb.ts` for movie search/metadata; `telegram.ts#telegramNotify` (escapes Markdown, logs and swallows failures). On Vercel, **await** notifications before responding: a fire-and-forget promise can be cut off when the function freezes.
