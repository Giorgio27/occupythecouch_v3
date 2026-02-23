# Coding Guidelines for OccupyTheCouch v3

This document provides coding standards and architectural guidelines for maintaining consistency across the codebase.

## 🏗️ Architecture Principles

### Code Organization by Execution Context

The project follows a strict separation based on where code executes:

```
lib/
├── client/     # Browser-only code (React hooks, API clients, contexts)
├── server/     # Server-only code (SSR helpers, API logic, external APIs)
└── shared/     # Shared code (types, DTOs, pure utilities)
```

**Rules:**

- ❌ **NEVER** import `lib/server/` code into client components
- ❌ **NEVER** import `lib/client/` code into API routes
- ✅ **ALWAYS** use `lib/shared/` for code needed in both contexts
- ✅ **ALWAYS** keep `lib/shared/` pure (no side effects, no environment-specific code)

### Server-Side Code Usage

Code in `lib/server/` is used in two contexts:

1. **API Routes** (`pages/api/`): Backend endpoints handling HTTP requests
2. **Server-Side Rendering** (`getServerSideProps`): Pre-rendering pages on the server

Both are valid server-side contexts. Examples:

- `lib/server/cineforum-layout-props.ts` → Used in `getServerSideProps`
- `lib/server/rounds/index.ts` → Used in API routes
- `lib/server/external/tmdb.ts` → Can be used in both

## 📁 File Placement Guidelines

### When to Create a Component

**Place in `components/ui/`** if:

- It's a reusable UI primitive (button, input, card, dialog)
- It comes from shadcn/ui
- It has no business logic
- It's styled with Tailwind and follows the design system

**Place in `components/cineforum/`** if:

- It's feature-specific (proposals, oscars, teams)
- It contains business logic or data fetching
- It's used in multiple pages within the cineforum feature

**Place in `components/` root** if:

- It's a layout component (`Layout.tsx`, `CineforumLayout.tsx`)
- It's a global component (header, footer)

### When to Create a Server Function

**Place in `lib/server/`** if:

- It accesses the database directly (uses Prisma)
- It calls external APIs (TMDB, OMDB, etc.)
- It contains sensitive logic (authentication, authorization)
- It's used in `getServerSideProps` or API routes

**Add to existing modules:**

- `lib/server/rounds/` → Round management logic
- `lib/server/external/` → Third-party API integrations
- `lib/server/ranking/` → Voting algorithms

### When to Create a Client Function

**Place in `lib/client/`** if:

- It makes HTTP requests to your API
- It's a React hook
- It's a React Context provider
- It contains browser-specific logic

**Organization:**

- `lib/client/cineforum/` → API client functions grouped by feature
- `lib/client/hooks/` → Custom React hooks
- `lib/client/contexts/` → React Context providers

### When to Create a Type

**Place in `lib/shared/types/`** if:

- It's a DTO (Data Transfer Object) used in API responses
- It's shared between client and server
- It represents domain models

**Place in `types/`** if:

- It's a global type augmentation (NextAuth, Next.js, etc.)
- It extends third-party library types

## 🎯 Naming Conventions

### Files

- **Components**: PascalCase (`CreateProposal.tsx`, `MovieRankRow.tsx`)
- **Utilities**: camelCase (`https.ts`, `utils.ts`)
- **Types**: camelCase (`cineforum.ts`, `users.ts`)
- **API Routes**: kebab-case or camelCase (`[proposalId].ts`, `close.ts`)

### Functions

- **React Components**: PascalCase (`CreateProposal`, `OpenProposal`)
- **Hooks**: camelCase with `use` prefix (`useAdminAccess`, `useCineforumContext`)
- **API Clients**: camelCase (`fetchProposal`, `createRound`)
- **Server Functions**: camelCase (`getCineforumLayoutProps`, `closeRound`)

### Types

- **Interfaces/Types**: PascalCase (`ProposalDetailDTO`, `CineforumLayoutServerProps`)
- **Props Types**: PascalCase with `Props` suffix (`CreateProposalProps`)

## 🔒 Authentication & Authorization

### Page-Level Protection

Use `getCineforumLayoutProps` helper for cineforum pages:

```typescript
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  // Your additional logic here...

  return {
    props: {
      ...cineforumProps.props,
      // your additional props
    },
  };
};
```

This helper:

- ✅ Checks authentication
- ✅ Verifies cineforum membership
- ✅ Returns cineforum data
- ✅ Handles redirects and 404s

### API Route Protection

Always check authentication and authorization in API routes:

```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Check membership/permissions
  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: session.user.id,
        cineforumId,
      },
    },
  });

  if (!membership || membership.disabled) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 3. Check admin role if needed
  if (!["ADMIN", "OWNER"].includes(membership.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Your logic here...
}
```

## 🎨 Component Patterns

### Server-Side Rendered Pages

```typescript
import { GetServerSideProps } from "next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";

type Props = {
  cineforumId: string;
  cineforumName: string;
  // your props
};

export default function MyPage({ cineforumId, cineforumName }: Props) {
  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      {/* Your content */}
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ('redirect' in cineforumProps || 'notFound' in cineforumProps) {
    return cineforumProps;
  }

  return { props: cineforumProps.props };
};
```

### Client-Side Data Fetching

```typescript
import { useEffect, useState } from "react";
import { fetchProposal } from "@/lib/client/cineforum/proposals";
import type { ProposalDetailDTO } from "@/lib/shared/types";

export function MyComponent({ proposalId }: { proposalId: string }) {
  const [proposal, setProposal] = useState<ProposalDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposal(proposalId)
      .then(setProposal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [proposalId]);

  if (loading) return <LoadingCard />;
  if (!proposal) return <EmptyState />;

  return <div>{/* Your content */}</div>;
}
```

## 🗄️ Database Access

### Use Prisma Client

```typescript
import prisma from "@/lib/prisma";

// Always use the singleton instance
const users = await prisma.user.findMany();
```

### Transaction Patterns

For complex operations that need atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  const round = await tx.round.update({ ... });
  const ranking = await tx.movieRoundRanking.create({ ... });
  return { round, ranking };
});
```

## 🚀 API Client Patterns

### Create Typed API Clients

Place in `lib/client/cineforum/`:

```typescript
import { jsonFetch } from "@/lib/client/https";
import type { MyResponseDTO } from "@/lib/shared/types";

export async function fetchMyData(id: string): Promise<MyResponseDTO> {
  return jsonFetch<MyResponseDTO>(`/api/my-endpoint/${id}`);
}

export async function createMyData(
  payload: MyPayload,
): Promise<{ id: string }> {
  return jsonFetch<{ id: string }>(`/api/my-endpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
```

## 📝 TypeScript Best Practices

### Use Shared Types

Define DTOs in `lib/shared/types/`:

```typescript
// lib/shared/types/cineforum.ts
export type ProposalDetailDTO = {
  id: string;
  title: string;
  closed: boolean;
  // ...
};
```

### Avoid `any`

Use proper types or `unknown` when type is truly unknown:

```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: ProposalDetailDTO) { ... }

// ✅ Acceptable when type is unknown
function process(data: unknown) {
  if (typeof data === "object" && data !== null) {
    // Type guard
  }
}
```

## 🧪 Error Handling

### API Routes

```typescript
try {
  // Your logic
  return res.status(200).json({ success: true });
} catch (error: any) {
  console.error("Error in API route:", error);
  return res.status(500).json({ error: "Internal server error" });
}
```

### Client-Side

```typescript
try {
  const data = await fetchProposal(id);
  setProposal(data);
} catch (error) {
  console.error("Failed to fetch proposal:", error);
  // Show error UI
}
```

## 📚 Documentation

### JSDoc Comments

Add JSDoc to exported functions:

```typescript
/**
 * Fetches a proposal by ID with all related data.
 *
 * @param proposalId - The unique identifier of the proposal
 * @returns Promise resolving to the proposal details
 * @throws Error if the proposal is not found or user lacks access
 */
export async function fetchProposal(
  proposalId: string,
): Promise<ProposalDetailDTO> {
  // ...
}
```

### README Updates

When adding new features:

1. Update `README.md` if it affects project structure
2. Create feature documentation in `docs/` if needed
3. Update this file if new patterns are introduced

## 🔍 Code Review Checklist

Before submitting code:

- [ ] No `lib/server/` imports in client components
- [ ] No `lib/client/` imports in API routes
- [ ] Authentication/authorization checks in place
- [ ] Types defined in `lib/shared/types/`
- [ ] Error handling implemented
- [ ] JSDoc comments for exported functions
- [ ] No `any` types (unless absolutely necessary)
- [ ] Consistent naming conventions
- [ ] No console.logs in production code (use proper logging)

## 🎯 Common Patterns

### Pagination

```typescript
export async function listItems(options: { offset?: number; limit?: number }) {
  const { offset = 0, limit = 10 } = options;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.count(),
  ]);

  const status = offset + limit >= total ? "completed" : "progress";
  return { items, total, status };
}
```

### Conditional Rendering

```typescript
if (loading) return <LoadingCard />;
if (error) return <ErrorState error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

---

**Remember**: Consistency is key. When in doubt, look at existing code for patterns and follow the same approach.
