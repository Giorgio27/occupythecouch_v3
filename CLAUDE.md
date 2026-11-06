# OccupyTheCouch v3

Collaborative movie selection and voting app for cineforum communities.

Next.js 16 (Pages Router) · React 18 · PostgreSQL + Prisma 6 · NextAuth v4 · Tailwind 4 + shadcn-ui · TypeScript strict · react-i18next (it, en)

These rules apply to **new and changed code**. Some older files don't comply (e.g. single-file API routes, inline Prisma in handlers); don't refactor them unless asked.

## ⚠️ Production data: never erase

The Vercel Postgres database holds the clubs' real data, with no migrations and no automatic backups. **Assume `DATABASE_URL` is production.**

**Claude never runs anything that connects to a database**, local or production: no `prisma db *`, `prisma migrate *`, `prisma studio`, `npm run db:*`, `scripts/db/*`, `psql`/`pg_dump`, or ad-hoc Prisma scripts. Claude writes the schema change or script and **suggests the exact commands; the user runs them** and reports back. Offline commands are fine: `prisma format`, `prisma validate`, `prisma generate`.

Schema changes are additive only; nothing may delete, reset or overwrite data. Follow the `db-change` skill for anything touching the schema or data.

## Domain in one breath

A **Cineforum** (club) runs **Rounds**. In a round, members or **Teams** make **Proposals** (a few candidate movies); members rank them (**ProposalVote**) and the **Schulze** method picks the winner. Members then rate each winner movie 0–5 in 0.25 steps (**MovieVote**, the "**Oscars**" vote). **Always display ratings (single votes and averages) with two decimals (`toFixed(2)`)**: one decimal turns 4.25 into 4.3, a recurring bug. **Closing a round** freezes it into **MovieRoundRanking** + **UserRanking**, feeding all rankings/stats, and posts to Telegram. Movies are global; everything else is per cineforum. Details, files and invariants: the `cineforum-domain` skill.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Type check (must pass, zero errors) | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Regenerate Prisma client after schema edits | `npx prisma generate` |
| Local Postgres (user runs it) | `docker compose -f docker-compose.postgres.yml up -d` |

- There is no test suite. Verification = `tsc` + `npm run build` + manual check on a Vercel Preview.
- `next build` rewrites `next-env.d.ts` (dev ↔ build route types). Don't commit that diff.
- No migrations folder: schema changes are applied with `prisma db push` against whatever `DATABASE_URL` points to (see "Production data" above).
- npm 11 blocks dependency install scripts; the project `postinstall` still runs `prisma generate`.

## Deploy

Vercel, from `main`. The Node version comes from `engines.node` in `package.json` (`24.x`, keep it in sync with `.nvmrc`) and overrides the dashboard. Always use an exact `NN.x`, never a range like `>=20`, or Vercel silently moves to its newest default.

## File size limits (hard)

| File | Max lines | When exceeded |
| --- | --- | --- |
| React component | 150 | Extract sub-components into the same feature folder |
| Page | 300 | Delegate rendering to feature components |
| API route handler | 80 | Move logic to `lib/server/<domain>/` |
| `lib/server/` function | 100 | Split by responsibility |
| `lib/client/` file | 60 | One domain per file |
| Shared type file | 80 | Split by domain |

## Execution-context boundaries (critical)

```
lib/client/   browser only: hooks, API clients, contexts
lib/server/   server only: Prisma, external APIs, SSR helpers
lib/shared/   pure: DTOs, domain types, pure utils (no Prisma, fetch, window, env)
```

- Never import `lib/server/` from components, hooks or contexts.
- Never import `lib/client/` from API routes or `getServerSideProps`.
- `lib/shared/` is the only cross-boundary import.

## File placement

| What | Where |
| --- | --- |
| UI primitive (shadcn) | `components/ui/` |
| Feature component | `components/cineforum/<feature>/` |
| Landing / public component | `components/home/` |
| Layout, header, footer | `components/` root, `components/header/` |
| Prisma queries, external APIs, SSR helpers | `lib/server/<domain>/` |
| HTTP client functions | `lib/client/cineforum/<domain>.ts` (+ export from `index.ts`) |
| Hooks / contexts | `lib/client/hooks/`, `lib/client/contexts/` |
| DTOs | `lib/shared/types/<domain>.ts` (+ `export *` from `index.ts`) |
| Global type augmentation | `types/` |
| Cineforum page (auth) | `pages/cineforum/[cineforumId]/` |
| Public page | `pages/` root |
| API route | `pages/api/cineforum/[cineforumId]/...` |
| Translations | `locales/<it|en>/<namespace>.json` |

## Naming

- Components: PascalCase `.tsx`, default export, props type `XxxProps`. Barrels re-export as named: `export { default as X } from "./X"`.
- Utility/type files: camelCase `.ts`. Hooks: `useXxx`.
- Client fns verb-first (`fetchMoviesList`, `createRound`); server fns verb-first (`getCineforumLayoutProps`, `closeRound`).
- DTOs: `XxxDTO`; response wrappers: `XxxResponseDTO`.

## API routes

- **One file per HTTP method.** Use a folder: `resource/index.ts` (GET), `resource/create.ts` (POST), `resource/[id]/update.ts` (PUT), `resource/[id]/delete.ts` (DELETE).
- **Order:** method guard → `getServerSession` auth → validate params (`typeof x !== "string"` → 400) → membership (`!membership || membership.disabled` → 403) → admin check (`["ADMIN","OWNER"]`) → logic delegated to `lib/server/` → try/catch → 500.
- Known business failures: throw from `lib/server/` an `Error` with a `code` (e.g. `ROUND_NOT_READY`) and map it to a 4xx in the route. Never throw HTTP errors from `lib/server/`.
- Never return raw Prisma models; always map to a DTO.
- **Authorize through the resource.** When a route gets a `roundId`/`proposalId`/`teamId` instead of a `cineforumId`, load the resource first, then check membership (and admin role) on *its* `cineforumId`. Never trust a `userId` or `cineforumId` from the body; use the session.
- Response shapes: single resource → flat object; list → `{ body: T[] }`; paginated → `{ body, status: "completed" | "progress", total }`; mutation → `{ ok: true }` or the resource; error → `{ error, details? }`. Never leak internal messages or stacks.

Templates for every layer: the `feature-scaffolding` skill.

## Server code & Prisma

- `import prisma from "@/lib/prisma"` (singleton), only in `lib/server/` and API routes.
- Always `select`/`include` only what's needed. `Promise.all` for independent queries, `prisma.$transaction` for atomic multi-step writes.
- **Prisma Accelerate caps interactive transactions at 15s** (asking for more fails with P6005). Use `{ timeout: 14_000, maxWait: 5_000 }`; inside a transaction do no reads you could do before it and no per-row query loops; prefer nested writes, `createMany`, `updateMany`. Every query is a network round trip.
- **One-way state changes are idempotent:** claim with `updateMany({ where: { id, closed: false }, data: { closed: true } })` and continue only if `count === 1` (see `closeRound`).
- **External calls** (TMDB, OMDB, IMDb, Telegram) only through `lib/server/external/`. Telegram goes **after** the DB write commits, is **awaited** (Vercel may freeze the function once the response is sent), and its failure never fails the request.
- JSDoc on every exported function.

## DTOs (`lib/shared/types/`)

Pure data only: dates as ISO `string`, never `Date`; optional fields as `T | null`, not `undefined`; no functions, classes or Prisma types.

## Pages

- Every page under `pages/cineforum/[cineforumId]/` uses `getServerSideProps` with `getCineforumLayoutProps` (handles auth, membership, `initialLocale`). Never re-implement auth.
- SSR props carry only auth/membership/locale and small first-render data. Fetch lists client-side.
- Always render all three states: loading (`LoadingCard`) → empty (`EmptyState`) → data.
- Admin UI uses the `useAdminAccess` hook.

## UI

- No `"use client"` (Pages Router). shadcn from `components/ui/`, never `@radix-ui/*` directly. Icons from `lucide-react`.
- Semantic tokens only (`bg-card`, `text-muted-foreground`, `border-border`, `text-primary`…), never hardcoded colors. Utilities: `cine-card`, `text-gradient`, `glow-red-soft`, `animate-fade-in-up`.
- Mobile-first (`sm:`/`lg:`), `tabular-nums` on numbers, `rounded-xl` cards/inputs, `rounded-lg` inner, `rounded-full` badges.
- Reuse `StatCard`, `SectionHeader`, `EmptyState`, `ExpandableList(Item)`, `LoadingCard`, `InfoNote` from `@/components/cineforum/common`.
- User-facing strings through `useTranslation("<namespace>")`; add keys to both `it` and `en`. Markup inside a translation goes through `<Trans>`, never `dangerouslySetInnerHTML`.
- **Horizontal overflow zooms the whole page out on phones** (content shrinks to the left, blank strip on the right; recurring bug). Cause: `truncate`/`whitespace-nowrap` text inside a grid or flex item that can't shrink. Mobile grids always get an explicit `grid-cols-1` (a bare `grid` sizes its column to the widest nowrap text), and every item holding truncated text gets `min-w-0`. Test with the longest real title (e.g. "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb").
- Most users are on phones. Drag-and-drop and touch interactions (proposal ranking) have broken repeatedly: keep the existing mobile fallbacks and ask the user to test on a real phone.

Patterns and examples: the `frontend-components` skill.

## TypeScript & style

- No `any` (use `unknown` + guards); prefer `satisfies` over `as`; `import type` for types; explicit return types on exports; no unused code.
- Imports order: React/Next → third-party → `lib/server` → `lib/client` → components → types.
- Component order: types → small sub-components → hooks → state → derived → callbacks → effects → early returns → render.
- JSX: one prop per line at 3+ props; name complex conditions; max ~4 nesting levels.
- Named constants or union types instead of magic values. Comments explain *why*; no commented-out code.
- Logging: `console.error` only for real failures, `console.info` for server operational tracing. Never `console.log`/`debug`/`warn` (Vercel flags `console.error` as an error).

## Before finishing

A Stop hook runs `npx tsc --noEmit` when `.ts`/`.tsx` files changed and reports errors back; fix them. For dependency or config changes, also run `npm run build`.
