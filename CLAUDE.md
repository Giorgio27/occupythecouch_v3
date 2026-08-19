# OccupyTheCouch v3 — Project Conventions

Mirrors `.clinerules`, itself consolidated from `.roo/rules-skill-writer/` and `.roo/skills/`. Keep the two files in sync — update both when conventions change.

---

## Stack Overview

Next.js (Pages Router) · PostgreSQL · Prisma · React · Tailwind CSS · shadcn-ui · TypeScript (strict) · react-i18next

---

## 0. File Size Limits (hard rules)

| File type              | Max lines | Action when exceeded                                      |
| ---------------------- | --------- | --------------------------------------------------------- |
| React component        | 150       | Extract named sub-components into the same feature folder |
| Page component         | 300       | Delegate rendering to feature components; keep page thin  |
| API route handler      | 80        | Move business logic to `lib/server/<domain>/`             |
| `lib/server/` function | 100       | Split by responsibility into separate files               |
| `lib/client/` file     | 60        | One domain per file; split if needed                      |
| Shared type file       | 80        | Split by domain                                           |

Never add unrelated logic to an existing file for convenience.

---

## 1. Execution-Context Boundaries (CRITICAL)

```
lib/
├── client/    # Browser only — React hooks, API clients, contexts
├── server/    # Server only — Prisma, external APIs, SSR helpers
└── shared/    # Pure — DTOs, domain types, pure utilities (no side effects)
```

**Hard rules:**

- ❌ Never import `lib/server/` in client components, hooks, or contexts
- ❌ Never import `lib/client/` in API routes or `getServerSideProps`
- ✅ `lib/shared/` is the only safe cross-boundary import
- ✅ `lib/shared/` must stay pure: no Prisma, no `fetch`, no `window`, no env vars

---

## 2. File Placement

| What                                                 | Where                                   |
| ---------------------------------------------------- | --------------------------------------- |
| UI primitive (no business logic, shadcn-ui based)    | `components/ui/`                        |
| Feature component (business logic / data)            | `components/cineforum/<feature>/`       |
| Home / landing / public page component               | `components/home/`                      |
| Layout / global header / footer                      | `components/` root                      |
| Prisma queries / external API calls / SSR helpers    | `lib/server/<domain>/`                  |
| HTTP client functions                                | `lib/client/cineforum/<domain>.ts`      |
| Custom React hooks                                   | `lib/client/hooks/`                     |
| React Context providers                              | `lib/client/contexts/`                  |
| DTO / domain type (shared between client and server) | `lib/shared/types/<domain>.ts`          |
| Global type augmentation (NextAuth, Next.js, etc.)   | `types/`                                |
| Cineforum page (auth-protected)                      | `pages/cineforum/[cineforumId]/`        |
| Public page (no auth required)                       | `pages/` root                           |
| API route                                            | `pages/api/cineforum/[cineforumId]/...` |
| i18n translation files                               | `locales/<lang>/<namespace>.json`       |

---

## 3. Naming Conventions

| Kind                  | Convention                    | Example                                 |
| --------------------- | ----------------------------- | --------------------------------------- |
| React component file  | PascalCase `.tsx`             | `MovieListCard.tsx`                     |
| Utility / type file   | camelCase `.ts`               | `rankings.ts`, `movies.ts`              |
| API route file        | camelCase or kebab-case `.ts` | `close.ts`, `last.ts`                   |
| React component fn    | PascalCase                    | `MovieListCard`                         |
| Hook                  | `use` prefix + camelCase      | `useAdminAccess`                        |
| API client fn         | camelCase, verb first         | `fetchMoviesList`, `createRound`        |
| Server fn             | camelCase, verb first         | `getCineforumLayoutProps`, `closeRound` |
| DTO / type            | PascalCase + `DTO` suffix     | `MovieStatsDTO`, `RoundSummaryDTO`      |
| Response wrapper type | PascalCase + `ResponseDTO`    | `MoviesListResponseDTO`                 |
| Props type            | PascalCase + `Props` suffix   | `MovieListCardProps`                    |
| Barrel file           | `index.ts`                    | named re-exports only, no default       |

---

## 4. API Routes — Complete Pattern

### 4a. Standard cineforum route (GET)

```typescript
// pages/api/cineforum/[cineforumId]/my-resource.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getMyResourceData } from "@/lib/server/my-resource";
import type { MyResourceDTO } from "@/lib/shared/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Method guard — always first
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  // 2. Auth check
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  // 3. Validate path params
  const { cineforumId } = req.query;
  if (typeof cineforumId !== "string")
    return res.status(400).json({ error: "Invalid cineforumId" });

  // 4. Membership check
  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled)
    return res.status(403).json({ error: "Forbidden" });

  // 5. Business logic (delegated to lib/server/)
  try {
    const data = await getMyResourceData(cineforumId);
    return res.status(200).json({ body: data, status: "completed" });
  } catch (error) {
    console.error(
      "Error in GET /api/cineforum/[cineforumId]/my-resource:",
      error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

### 4b. One file per endpoint (HARD RULE)

Each API file must handle **exactly one HTTP method**. Use a folder with one file per method:

```
pages/api/cineforum/[cineforumId]/
├── my-resource/
│   ├── index.ts      ← GET
│   └── create.ts     ← POST
├── my-resource/[id]/
│   ├── index.ts      ← GET
│   ├── update.ts     ← PUT
│   └── delete.ts     ← DELETE
```

### 4c. Admin-only route

Add after membership check:

```typescript
if (!["ADMIN", "OWNER"].includes(membership.role)) {
  return res.status(403).json({ error: "Admin access required" });
}
```

### 4d. Structured error codes

```typescript
// In lib/server/
const error: Error & { code?: string; details?: unknown } = new Error("Round cannot be closed");
error.code = "ROUND_NOT_READY";
throw error;

// In the API route
} catch (e: unknown) {
  const err = e as { code?: string; message?: string; details?: unknown };
  if (err?.code === "ROUND_NOT_READY") {
    return res.status(400).json({ error: err.message, details: err.details });
  }
  return res.status(500).json({ error: "Internal server error" });
}
```

### 4e. API response shape conventions

| Scenario             | Shape                                                           |
| -------------------- | --------------------------------------------------------------- |
| Single resource      | `{ ...fields }` (flat)                                          |
| List with pagination | `{ body: T[], status: "completed"\|"progress", total: number }` |
| Simple list          | `{ body: T[] }`                                                 |
| Mutation success     | `{ ok: true }` or the created/updated resource                  |
| Error                | `{ error: string, details?: unknown }`                          |

**Never** return raw Prisma model objects — always map to a DTO.

---

## 5. `lib/server/` — Server Function Pattern

```typescript
// lib/server/my-domain/index.ts
import prisma from "@/lib/prisma";
import type { MyResourceDTO } from "@/lib/shared/types";

/**
 * Fetches my resource data for a given cineforum.
 */
export async function getMyResourceData(
  cineforumId: string,
): Promise<MyResourceDTO[]> {
  const rows = await prisma.myModel.findMany({
    where: { cineforumId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
  return rows.map((r) => ({ id: r.id, title: r.title }));
}
```

**Rules:**

- Always use `select` or `include` — never return the full Prisma model
- Use `Promise.all` for parallel independent queries
- Use `prisma.$transaction` for multi-step writes that must be atomic
- Never throw HTTP errors from `lib/server/` — throw domain errors with `code`
- JSDoc on every exported function

---

## 6. `lib/shared/types/` — DTO Pattern

```typescript
export type MyResourceDTO = {
  id: string;
  title: string;
  createdAt: string; // ISO string — never Date objects in DTOs
  count: number;
  optionalField: string | null; // explicit null, never undefined for optional API fields
};
```

**Rules:**

- Export from `lib/shared/types/index.ts` via `export * from "./my-domain"`
- Use `string` for dates (ISO 8601), never `Date`
- Use `T | null` for optional fields, not `T | undefined`
- No functions, no class instances, no Prisma types — pure data shapes only

---

## 7. `lib/client/cineforum/` — Client Function Pattern

```typescript
import { jsonFetch } from "@/lib/client/https";
import type { MyResourceListResponseDTO } from "@/lib/shared/types";

export async function fetchMyResources(
  cineforumId: string,
): Promise<MyResourceListResponseDTO> {
  return jsonFetch<MyResourceListResponseDTO>(
    `/api/cineforum/${cineforumId}/my-resource`,
  );
}
```

**Rules:**

- Always type the generic on `jsonFetch<T>`
- Export from `lib/client/cineforum/index.ts`
- No React hooks, no `useState`, no `useEffect` in client function files
- One domain per file; keep files ≤ 60 lines

---

## 8. Pages — SSR Patterns

### 8a. Cineforum pages (always SSR)

All pages under `pages/cineforum/[cineforumId]/` **must** use `getServerSideProps` with `getCineforumLayoutProps`.

```typescript
// Minimal form
export const getServerSideProps: GetServerSideProps = async (ctx) =>
  getCineforumLayoutProps(ctx);

// Extended form (extra server data)
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps)
    return cineforumProps;
  const { cineforumId } = cineforumProps.props as { cineforumId: string };
  // ... additional server data
  return { props: { ...cineforumProps.props, extra } };
};
```

### 8b. Client-side data fetching in pages

```typescript
export default function MyPage({ cineforumId, cineforumName }: Props) {
  const [data, setData] = useState<MyResourceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyResources(cineforumId)
      .then((res) => setData(res.body))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cineforumId]);

  if (loading) return <CineforumLayout ...><LoadingCard text="Caricamento..." /></CineforumLayout>;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      {data.length === 0
        ? <EmptyState title="Nessun dato" subtitle="Nessun elemento trovato." />
        : <div className="space-y-3">{data.map((item) => <MyCard key={item.id} item={item} />)}</div>
      }
    </CineforumLayout>
  );
}
```

**Always handle all three states:** loading → empty → data.

### 8c. When NOT to use `getServerSideProps`

- ❌ Don't fetch list data in `getServerSideProps` for cineforum pages — fetch client-side
- ❌ Don't pass large data arrays as SSR props
- ✅ Only pass: auth/membership data, initial locale, small critical data for first render

---

## 9. Authentication & Authorization

Order in API routes: **method guard → auth → param validation → membership → admin check → logic → error handler**

In pages: use `getCineforumLayoutProps` — never re-implement auth logic.

In components (admin UI): use `useAdminAccess` hook.

---

## 10. Prisma Usage

```typescript
import prisma from "@/lib/prisma"; // always the singleton

// Always select only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true },
});

// Parallel queries
const [items, total] = await Promise.all([
  prisma.item.findMany({ where: { cineforumId }, skip: offset, take: limit }),
  prisma.item.count({ where: { cineforumId } }),
]);

// Atomic multi-step writes
await prisma.$transaction(async (tx) => { ... });
```

**Rules:**

- Never use `prisma` in `lib/client/` or component files
- Never return raw Prisma model objects — map to DTOs
- Use `select` to avoid over-fetching
- Pagination: always return `{ items, total, status: offset + limit >= total ? "completed" : "progress" }`

---

## 11. TypeScript Strictness

- No `any` — use proper types or `unknown` with type guards
- Prefer `satisfies` over `as`
- Explicit return types on all exported functions
- `import type` for type-only imports
- No unused imports or variables
- `npx tsc --noEmit` must pass with zero errors

---

## 12. i18n (react-i18next)

```typescript
import { useTranslation } from "react-i18next";
const { t } = useTranslation("rankings"); // namespace matches locales/<lang>/rankings.json
```

Every page must pass `initialLocale` from `getServerSideProps`. `getCineforumLayoutProps` already includes it.

---

## 13. Component Structure Rules

- **No `"use client"` directive** — this is Pages Router, not App Router
- **No default exports from barrel `index.ts`** — named re-exports only
- **Import shadcn-ui from `components/ui/`**, never from `@radix-ui` directly
- **Icons always from `lucide-react`**

---

## 14. Design System Tokens

Always use semantic Tailwind tokens — never hardcode colors.

| Token                  | Tailwind class               | Use for                |
| ---------------------- | ---------------------------- | ---------------------- |
| `--background`         | `bg-background`              | Page background        |
| `--foreground`         | `text-foreground`            | Primary text           |
| `--card`               | `bg-card`                    | Card surfaces          |
| `--primary` (cine-red) | `bg-primary`, `text-primary` | Accent, CTAs           |
| `--secondary`          | `bg-secondary`               | Subtle backgrounds     |
| `--muted-foreground`   | `text-muted-foreground`      | Secondary text, labels |
| `--border`             | `border-border`              | All borders            |

**Custom utility classes** (defined in globals.css):

```
cine-card          → styled card with border + bg-card
cine-card-fit      → card that fits its content width
text-gradient      → primary-colored gradient text (ratings, highlights)
glow-red-soft      → subtle red glow shadow
animate-fade-in-up → entrance animation
animate-fade-in    → simple fade
```

---

## 15. Tailwind Class Conventions

- Semantic tokens only — never hardcode colors
- Conditional classes: template literals or `clsx`
- Numbers/ratings: always `tabular-nums`
- Transitions: `transition-all duration-200` or `transition-colors`
- Rounded: `rounded-xl` for cards/inputs, `rounded-lg` for inner elements, `rounded-full` for badges/dots
- Responsive: always mobile-first (`sm:`, `lg:` overrides)
- Recharts tooltips: use CSS vars (`var(--border)`, `var(--popover)`) not Tailwind classes

---

## 16. Error Handling

### API routes

```typescript
try {
  const data = await doSomething();
  return res.status(200).json({ body: data });
} catch (error) {
  console.error("Error in [route name]:", error);
  return res.status(500).json({ error: "Internal server error" });
}
```

- `console.error` is the only allowed `console.*` in production code
- Never `console.log` in production code
- Never expose internal error messages or stack traces to the client

---

## 17. Code Readability & Style

### Import order

```typescript
// 1. React / Next.js
import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";

// 2. Third-party
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";

// 3. lib/server (API routes / getServerSideProps only)
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";

// 4. lib/client
import { fetchMoviesList } from "@/lib/client/cineforum/movies";

// 5. Components
import CineforumLayout from "@/components/CineforumLayout";
import { Button } from "@/components/ui/button";

// 6. Shared types (type-only)
import type { MovieStatsDTO } from "@/lib/shared/types";
```

### Component file structure

```
1. Imports
2. Local types
3. Small tightly-coupled sub-components (if any)
4. Main exported component:
   4a. Hooks (never conditional)
   4b. State
   4c. Derived / memoized values
   4d. Callbacks
   4e. Effects
   4f. Early returns
   4g. Main render
```

### JSX readability

- One prop per line when 3+ props
- Extract complex conditions into named booleans
- Extract repeated JSX into sub-components
- Avoid nesting deeper than 4 levels

### State management

- Group state that always changes together
- Keep independent state separate

### Async in components

Prefer named async functions over inline IIFEs:

```typescript
const loadMovies = async () => {
  try {
    setLoading(true);
    const response = await fetchMoviesList(cineforumId);
    setMovies(response.body);
  } catch (error) {
    console.error("Error loading movies:", error);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  loadMovies();
}, [cineforumId]);
```

### Magic values

Extract magic numbers/strings into named constants or union types.

### Comments

Explain **why**, not **what**. Use `// TODO:`, `// FIXME:`, `// NOTE:`. Never leave commented-out code.

---

## 18. Common UI Patterns

### StatCard

```typescript
import { StatCard } from "@/components/cineforum/common";
<StatCard icon={<Trophy className="w-5 h-5 text-primary" />} iconBg="bg-primary/10" label="Media" value={avg?.toFixed(2) ?? "N/A"} />
```

### SectionHeader

```typescript
import { SectionHeader } from "@/components/cineforum/common";
<SectionHeader icon={<Heart className="w-4 h-4" />} title="Amore Ricevuto" subtitle="..." />
```

### EmptyState

```typescript
import { EmptyState } from "@/components/cineforum/common";
<EmptyState title="Nessun risultato" subtitle="Prova a cambiare i filtri." icon={<Search className="w-8 h-8 text-muted-foreground" />} />
// Inside an existing card section:
<EmptyState title="Nessun film" variant="muted" />
```

### ExpandableList + ExpandableListItem

```typescript
import { ExpandableList, ExpandableListItem } from "@/components/cineforum/common";
<ExpandableList
  items={directors}
  renderItem={(director, index, isExpanded, onToggle) => (
    <ExpandableListItem
      key={director.id}
      position={index + 1}
      title={director.name}
      metric={director.average_rating.toFixed(2)}
      isExpanded={isExpanded}
      onToggle={onToggle}
      animationDelay={index * 30}
    >
      <DirectorMoviesTable movies={director.movies} />
    </ExpandableListItem>
  )}
/>
```

---

## 19. Pre-Commit Checklist

**Architecture & boundaries**

- [ ] No `lib/server/` imports in client components, hooks, or contexts
- [ ] No `lib/client/` imports in API routes or `getServerSideProps`
- [ ] All DTOs in `lib/shared/types/` and exported from `index.ts`
- [ ] All client functions in `lib/client/cineforum/` and exported from `index.ts`

**API routes**

- [ ] One file per endpoint — never mix multiple HTTP methods in one file
- [ ] Order: method guard → auth → param validation → membership → (admin check) → logic → error handler
- [ ] No raw Prisma models returned — always map to DTOs
- [ ] Structured error codes for known business failures

**Pages**

- [ ] Every cineforum page uses `getCineforumLayoutProps` in `getServerSideProps`
- [ ] No large data arrays passed as SSR props — fetch client-side instead
- [ ] All three states handled: loading → empty → data

**TypeScript**

- [ ] No `any` — use proper types or `unknown` with type guards
- [ ] No unused imports or variables
- [ ] Explicit return types on all exported functions
- [ ] `import type` for type-only imports
- [ ] `npx tsc --noEmit` passes with zero errors

**Code quality**

- [ ] JSDoc on all exported functions
- [ ] No `console.log` (only `console.error` in server-side error handlers)
- [ ] No commented-out code
- [ ] No magic numbers/strings — use named constants or union types
- [ ] Imports in correct order
- [ ] Component file structure followed
- [ ] JSX with 3+ props: one prop per line
- [ ] Long Tailwind class strings broken with `clsx` or template literals
