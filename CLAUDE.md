# OccupyTheCouch v3

Collaborative movie selection and voting app for cineforum communities.

Next.js 16 (Pages Router) · React 18 · PostgreSQL + Prisma 6 · NextAuth v4 · Tailwind 4 + shadcn-ui · TypeScript strict · react-i18next (it, en)

These rules apply to **new and changed code**. Some older files don't comply (e.g. single-file API routes, inline Prisma in handlers); don't refactor them unless asked.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Type check (must pass, zero errors) | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Regenerate Prisma client after schema edits | `npx prisma generate` |
| Local Postgres | `docker compose -f docker-compose.postgres.yml up -d` |

- There is no test suite. Verification = `tsc` + `npm run build` + manual check on a Vercel Preview.
- `next build` rewrites `next-env.d.ts` (dev ↔ build route types). Don't commit that diff.
- No migrations folder: schema changes are applied with `prisma db push` against whatever `DATABASE_URL` points to. Never run it, or any `db:*` script, without asking.
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
- Response shapes: single resource → flat object; list → `{ body: T[] }`; paginated → `{ body, status: "completed" | "progress", total }`; mutation → `{ ok: true }` or the resource; error → `{ error, details? }`. Never leak internal messages or stacks.

Templates for every layer: the `feature-scaffolding` skill.

## Server code & Prisma

- `import prisma from "@/lib/prisma"` (singleton), only in `lib/server/` and API routes.
- Always `select`/`include` only what's needed. `Promise.all` for independent queries, `prisma.$transaction` for atomic multi-step writes.
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
- User-facing strings through `useTranslation("<namespace>")`; add keys to both `it` and `en`.

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
