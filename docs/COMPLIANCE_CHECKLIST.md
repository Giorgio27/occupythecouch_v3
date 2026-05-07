# Compliance Checklist — Stack Conventions Audit

Ogni sezione è un gruppo di file da pulire insieme. Spunta i file man mano che vengono sistemati.
Regole di riferimento: `.roo/skills/stack-conventions/SKILL.md`

---

## 🔴 CRITICO — Sicurezza API (fare subito)

### Membership check mancante nelle API rounds

- [x] `pages/api/cineforum/rounds/index.ts`
  - **Problema:** nessun check di membership — qualsiasi utente autenticato può listare/creare rounds di qualsiasi cineforum
  - **Fix:** dopo il check auth, recuperare il `cineforumId` dal body/query e verificare membership

- [x] `pages/api/cineforum/rounds/[roundId]/close.ts`
  - **Problema:** nessun check di membership né di ruolo admin — qualsiasi utente autenticato può chiudere qualsiasi round
  - **Fix:** recuperare il round per ottenere `cineforumId`, poi verificare membership + `["ADMIN","OWNER"]`

---

## 🟡 TIPO — `any` nei componenti proposal/open

Tutti questi componenti usano `any` per tipi già definiti in `lib/shared/types/cineforum.ts` (`ProposalDetailDTO`, `ProposalMovieDTO`, `ProposalRankingDTO`).

- [x] `components/cineforum/proposal/open/ProposalHeader.tsx`
  - `proposal: any` → `ProposalDetailDTO`

- [x] `components/cineforum/proposal/open/UnrankedPanel.tsx`
  - `movies: any[]` → `ProposalMovieDTO[]`

- [x] `components/cineforum/proposal/open/RankingSlot.tsx`
  - `movies: any[]` → `ProposalMovieDTO[]`

- [x] `components/cineforum/proposal/open/MovieVotingCard.tsx`
  - `movie: any` → `ProposalMovieDTO`

- [x] `components/cineforum/proposal/open/MovieRankRow.tsx`
  - `movie: any`, `lists: Record<string, any[]>`, `draggedMovie: any` → `ProposalMovieDTO`

- [x] `components/cineforum/proposal/open/ResultsPanel.tsx`
  - `ranking: any`, `proposal: any` → `ProposalRankingDTO`, `ProposalDetailDTO`

- [x] `components/cineforum/proposal/open/OpenProposal.tsx`
  - `proposal: any`, `rankedMovies: Record<number, any[]>`, `unrankedMovies: any[]`, `ranking: any` → tipi corretti
  - Estrarre `handleSubmit` come funzione named invece di `async () =>` inline nell'`onSubmit`

- [x] `components/cineforum/proposal/create/CreateProposal.tsx`
  - `toggleMovie(m: any)` → `ImdbSuggestionDTO`

- [x] `components/cineforum/proposal/create/MovieSearch.tsx`
  - `onResults: (items: any[]) => void` → `(items: ImdbSuggestionDTO[]) => void`

---

## 🟡 TIPO — `catch (e: any)` → `catch (e: unknown)`

- [x] `pages/api/cineforum/rounds/[roundId]/close.ts` (riga 29)
- [x] `pages/api/cineforum/[cineforumId]/membership.ts` (riga 50)
- [x] `pages/api/cineforum/[cineforumId]/admin/users/[userId].ts` (riga 156)
- [x] `pages/api/cineforum/[cineforumId]/admin/users/invite.ts` (riga 127)
- [x] `pages/api/cineforum/[cineforumId]/admin/users/index.ts` (riga 84)
- [x] `pages/cineforum/[cineforumId]/admin/users.tsx` (4 occorrenze)
- [x] `pages/cineforum/[cineforumId]/admin/rounds.tsx` (3 occorrenze)

**Pattern fix:**

```typescript
// ❌
} catch (e: any) {
  console.error(e);
}

// ✅
} catch (e: unknown) {
  console.error(e);
}

// ✅ se serve accedere a .code o .message
} catch (e: unknown) {
  const err = e as { code?: string; message?: string; details?: unknown };
  if (err?.code === "KNOWN_CODE") { ... }
}
```

---

## 🟡 TIPO — `any` in server/lib

- [x] `lib/server/rounds/index.ts` (riga 113)
  - `const error: any = new Error(...)` → `const error: Error & { code?: string; details?: unknown } = new Error(...)`

- [ ] `lib/server/external/tmdb.ts` (righe 12–18)
  - `genres?: any`, `production_companies?: any`, ecc. → definire interfaccia propria o usare `unknown`

- [ ] `pages/api/cineforum/users/[userId]/candidates.ts` (riga 17)
  - `const whereTeam: any` → `const whereTeam: Prisma.TeamWhereInput`

---

## 🟡 TIPO — `ctx: any` nelle pagine

- [x] `pages/tutorial.tsx` (riga 5)
  - `getServerSideProps(ctx: any)` → `import type { GetServerSidePropsContext } from "next"`

- [x] `pages/index.tsx` (riga 18)
  - `getServerSideProps(ctx: any)` → `GetServerSidePropsContext`

---

## 🟡 ARCHITETTURA — DTOs definiti nel client invece di `lib/shared/types/`

- [ ] `lib/client/cineforum/proposals.ts`
  - Spostare `ProposalWinnersDTO` → `lib/shared/types/cineforum.ts`
  - Spostare `CandidateDTO` → `lib/shared/types/cineforum.ts`
  - `CreateProposalPayload` può restare nel client (è un payload di richiesta, non una risposta)

---

## 🟡 ARCHITETTURA — `import type` mancante

- [ ] `lib/client/cineforum/proposals.ts` (riga 2)
  - `import { ImdbSuggestionDTO, ProposalDetailDTO, ProposalRankingDTO }` → `import type { ... }`

Scan generale: cercare `import \{[^}]+DTO` in tutti i file `.ts`/`.tsx` e verificare che i tipi usati solo come tipo usino `import type`.

---

## 🟡 DOCUMENTAZIONE — JSDoc mancante su funzioni client esportate

- [ ] `lib/client/cineforum/proposals.ts`
  - `fetchCandidates`, `fetchProposal`, `fetchRanking`, `voteProposal`, `createProposal`, `imdbSearch`, `fetchProposalWinners`

- [ ] `lib/client/cineforum/rounds.ts`
  - `fetchRoundsPage`, `createRound`, `closeRound`

- [ ] `lib/client/cineforum/membership.ts`
  - `fetchCurrentMembership`

- [ ] `lib/client/cineforum/users.ts`
  - `fetchCineforumUsers`, `inviteUser`, `updateUserRole`, `toggleUserDisabled`

- [ ] `lib/client/cineforum/cineforum.ts`
  - `createCineforum`

---

## 🟡 STRUTTURA — Pagina troppo grande

- [ ] `pages/cineforum/[cineforumId]/stats/users.tsx` (1694 righe)
  - Estrarre `LoveReceivedTable` (righe ~1000–1260) → `components/cineforum/stats/LoveReceivedTable.tsx`
  - Estrarre `LoveGivenTable` (righe ~1262–1552) → `components/cineforum/stats/LoveGivenTable.tsx`
  - Estrarre `DeviantMoviesTable` (righe ~1610–1678) → `components/cineforum/stats/DeviantMoviesTable.tsx`
  - Estrarre `VotingProfileCard` (righe ~841–976) → `components/cineforum/stats/VotingProfileCard.tsx`
  - Ogni componente estratto porta con sé il proprio stato di sort/expand

---

## 🟢 MINORE — Stile e pulizia

- [x] `lib/server/external/telegram.ts` (riga 58)
  - Rimuovere `console.log("[telegram] sendMessage ok:...")` (path di successo, non serve loggare)

- [ ] `pages/cineforum/[cineforumId]/stats/users.tsx`
  - Stringhe italiane hardcoded (`"Caricamento statistiche..."`, `"Nessun utente trovato"`, ecc.) → spostare nel namespace `stats` di i18n

- [ ] `pages/cineforum/[cineforumId]/proposal.tsx` (riga 34)
  - Cast `cineforumProps.props as { cineforumId: string; cineforumName: string }` → usare `"props" in cineforumProps && cineforumProps.props` per narrowing type-safe

---

## ✅ GIÀ CONFORME — Non toccare

- Tutti i file `lib/client/cineforum/` usano `jsonFetch<T>` con generici tipizzati ✅
- Tutte le pagine cineforum usano `getCineforumLayoutProps` ✅
- Tutte le funzioni `lib/server/` hanno JSDoc ✅
- `lib/shared/types/` è pulito — nessuna funzione, nessun tipo Prisma, `null` esplicito ✅
- Boundary di import rispettati (nessun `lib/server` nel codice client) ✅
- Prisma singleton usato ovunque via `@/lib/prisma` ✅
- File `scripts/` esenti dalle regole di produzione ✅
- `types/recharts.d.ts` — `any` accettabile (type augmentation di libreria terza) ✅
- `scripts/db/` — `any` e `console.log` accettabili (script CLI) ✅

---

## 🎨 LEGGIBILITÀ — Pagine da estrarre in componenti (troppo grandi)

### `pages/cineforum/[cineforumId]/stats/users.tsx` — 1693 righe

- [ ] Estrarre `VotingProfileCard` (sezione "Profilo Votante" ~righe 841–976) → `components/cineforum/stats/VotingProfileCard.tsx`
  - Props: `profileStats: UserProfileStatsDTO`, `users: UserRankingDTO[]`, `selectedUserId: string`
- [ ] Estrarre `LoveReceivedTable` (tabella espandibile ~righe 980–1260) → `components/cineforum/stats/LoveReceivedTable.tsx`
  - Porta con sé: stato sort (`receivedSortBy`, `receivedSortDir`), stato expand (`expandedReceivedRows`), handlers
- [ ] Estrarre `LoveGivenTable` (tabella espandibile ~righe 1262–1552) → `components/cineforum/stats/LoveGivenTable.tsx`
  - Porta con sé: stato sort (`givenSortBy`, `givenSortDir`), stato expand (`expandedGivenRows`), handlers
- [ ] Estrarre `DeviantMoviesTable` (~righe 1610–1678) → `components/cineforum/stats/DeviantMoviesTable.tsx`
- [ ] Estrarre `RatingDistributionChart` (~righe 1554–1607) → `components/cineforum/stats/RatingDistributionChart.tsx`
- [ ] Aggiungere barrel `components/cineforum/stats/index.ts`

### `pages/cineforum/[cineforumId]/rankings/users.tsx` — 1145 righe

- [ ] Estrarre `SupplierSelectBar` (la barra di selezione supplier/comparazione) → `components/cineforum/rankings/SupplierSelectBar.tsx` (se non già estratta)
- [ ] Estrarre `ComparisonSection` (la sezione tabella comparazione) → `components/cineforum/rankings/ComparisonSection.tsx`
- [ ] Estrarre `UserRankingList` (la lista card utenti) → `components/cineforum/rankings/UserRankingList.tsx`

### `pages/cineforum/[cineforumId]/admin/proposals.tsx` — 837 righe

- [ ] Estrarre `ProposalEditForm` (form di editing titolo/descrizione/film) → `components/cineforum/proposal/admin/ProposalEditForm.tsx`
- [ ] Estrarre `ProposalWinnerSelector` (selezione vincitore) → `components/cineforum/proposal/admin/ProposalWinnerSelector.tsx`
- [ ] Estrarre `ProposalActionBar` (bottoni chiudi/riapri/toggle risultati) → `components/cineforum/proposal/admin/ProposalActionBar.tsx`

### `pages/cineforum/[cineforumId]/rankings/timeline.tsx` — 424 righe

- [ ] Estrarre `TimelineRoundCard` (la card di ogni round nella timeline) → `components/cineforum/rankings/TimelineRoundCard.tsx`

### `pages/cineforum/[cineforumId]/admin/users.tsx` — 418 righe

- [ ] Estrarre `UserRow` (la riga utente con azioni) → `components/cineforum/admin/UserRow.tsx`
- [ ] Estrarre `InviteUserForm` (form invito) → `components/cineforum/admin/InviteUserForm.tsx`

### `pages/cineforum/[cineforumId]/rankings/countries.tsx` — 392 righe

- [ ] Estrarre `CountryRankingCard` → `components/cineforum/rankings/CountryRankingCard.tsx`

### `pages/cineforum/[cineforumId]/rankings/proposals.tsx` — 391 righe

- [ ] Estrarre `ProposalRankingCard` (se non già estratta) → `components/cineforum/rankings/ProposalRankingCard.tsx`

### `pages/cineforum/[cineforumId]/admin/rounds.tsx` — 384 righe

- [ ] Estrarre `RoundRow` (la riga round con azioni) → `components/cineforum/admin/RoundRow.tsx`
- [ ] Estrarre `CreateRoundForm` (form creazione round) → `components/cineforum/admin/CreateRoundForm.tsx`

### `pages/cineforum/[cineforumId]/admin/teams.tsx` — 364 righe

- [ ] Estrarre `TeamCard` (card team con utenti) → `components/cineforum/admin/TeamCard.tsx`
- [ ] Estrarre `CreateTeamForm` (form creazione team) → `components/cineforum/admin/CreateTeamForm.tsx`

---

## 🎨 LEGGIBILITÀ — Componenti da pulire (>150 righe o logica inline)

### `components/header/CineforumHeaderNav.tsx` — 382 righe

- [ ] Estrarre `NavItem` (singolo item di navigazione con active state) → sub-componente nello stesso file o file separato
- [ ] Estrarre `AdminNavSection` (sezione link admin) → sub-componente

### `components/cineforum/rankings/UserRankingTrendChart.tsx` — 339 righe

- [ ] Estrarre `TrendTooltip` (tooltip custom del chart) → sub-componente nello stesso file
- [ ] Estrarre `SupplierLegend` (legenda supplier) → sub-componente

### `components/cineforum/proposal/create/CreateProposal.tsx` — 338 righe

- [ ] Estrarre `ProposalDatePicker` (selezione data + candidato) → `components/cineforum/proposal/create/ProposalDatePicker.tsx`
- [ ] Estrarre `ProposalMetaForm` (titolo + descrizione) → `components/cineforum/proposal/create/ProposalMetaForm.tsx`

### `components/home/auth.tsx` — 324 righe

- [ ] Estrarre `SignInForm` → sub-componente
- [ ] Estrarre `SignUpForm` → sub-componente

### `components/cineforum/proposal/open/OpenProposal.tsx` — 277 righe

- [ ] Estrarre `handleSubmit` come funzione named (attualmente è `async () =>` inline nell'`onSubmit` prop a riga 239)
- [ ] L'IIFE `(async () => { ... })()` a riga 45 è accettabile perché usa il flag `cancelled` — aggiungere commento `// NOTE: IIFE with cancellation flag — needed to prevent state update on unmount`

### `components/cineforum/proposal/open/MovieRankRow.tsx` — 258 righe

- [ ] Estrarre `DragHandle` (l'handle di drag) → sub-componente nello stesso file
- [ ] Estrarre `PositionBadge` (il badge posizione) → sub-componente nello stesso file

### `components/cineforum/proposal/open/MovieVotingCard.tsx` — 226 righe

- [ ] Estrarre `RatingStars` o `RatingInput` → sub-componente nello stesso file

### `components/home/TutorialStepsSection.tsx` — 239 righe

- [ ] Estrarre `StepCard` (la card di ogni step) → sub-componente nello stesso file

### `components/cineforum/rankings/movies-list/MovieListCard.tsx` — 183 righe

- [ ] Estrarre `MovieExpandedDetails` (il pannello espanso con dettagli) → sub-componente nello stesso file

### `components/cineforum/proposal/open/RankingSlot.tsx` — 191 righe

- [ ] Estrarre `DroppableSlot` (la zona droppable) → sub-componente nello stesso file

### `components/cineforum/proposal/open/ResultsPanel.tsx` — 184 righe

- [ ] Estrarre `TopMoviePodium` (i top 3 film) → sub-componente nello stesso file
- [ ] Estrarre `VoteRow` (la riga voto utente) → sub-componente nello stesso file

### `components/header/CineforumMobileMenu.tsx` — 252 righe

- [ ] Estrarre `MobileNavItem` → sub-componente nello stesso file

---

## 🎨 LEGGIBILITÀ — Prop inline su più righe (JSX con 3+ props su una riga)

Questi file hanno JSX con molte props su una riga sola — da formattare con una prop per riga:

- [ ] `components/cineforum/proposal/open/OpenProposal.tsx` — `<RankingSlot ... />` e `<UnrankedPanel ... />` (righe ~206–231)
- [ ] `components/cineforum/proposal/open/MovieRankRow.tsx` — chiamate a `onDrop`, `onTouchDrop` inline
- [ ] `components/cineforum/rankings/movies-list/MovieListCard.tsx` — `<MoviePoster ... />` e altri
- [ ] `pages/cineforum/[cineforumId]/admin/proposals.tsx` — vari `<Button onClick={...} disabled={...} className={...}>` su una riga

---

## 🎨 LEGGIBILITÀ — Condizioni complesse da estrarre in variabili named

- [ ] `components/cineforum/proposal/open/OpenProposal.tsx`
  - `const canVote = !proposal?.closed` e `const hasExistingVote = !!proposal?.my_vote` già estratti ✅
  - Verificare che non ci siano altre condizioni inline nel JSX

- [ ] `pages/cineforum/[cineforumId]/admin/proposals.tsx`
  - Estrarre condizioni di visibilità sezioni in variabili named (`showWinnerSelector`, `showEditForm`, ecc.)

- [ ] `pages/cineforum/[cineforumId]/stats/users.tsx`
  - Le condizioni `profileLoading ? <Skeleton /> : profileStats ? <Content /> : null` sono già leggibili ✅

---

## 🎨 LEGGIBILITÀ — Stringhe hardcoded (non i18n)

Questi file hanno testo UI hardcoded in italiano invece di usare `useTranslation`:

- [ ] `pages/cineforum/[cineforumId]/stats/users.tsx` — decine di stringhe italiane hardcoded (es. `"Statistiche Utenti"`, `"Seleziona Utente"`, `"Amore Ricevuto"`, ecc.) → aggiungere al namespace `stats`
- [ ] `pages/cineforum/[cineforumId]/admin/proposals.tsx` — stringhe admin hardcoded → namespace `admin`
- [ ] `pages/cineforum/[cineforumId]/admin/rounds.tsx` — stringhe hardcoded → namespace `admin`
- [ ] `pages/cineforum/[cineforumId]/admin/teams.tsx` — stringhe hardcoded → namespace `admin`
- [ ] `pages/cineforum/[cineforumId]/admin/users.tsx` — stringhe hardcoded → namespace `admin`
- [ ] `pages/cineforum/[cineforumId]/admin/notifications.tsx` — stringhe hardcoded → namespace `admin`
