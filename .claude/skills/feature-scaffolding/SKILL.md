---
name: feature-scaffolding
description: Templates and order for adding a new end-to-end feature to OccupyTheCouch v3 — shared DTO, lib/server query, API route (one file per method), typed client function, feature component, and cineforum SSR page. Use when creating a new API endpoint, a new data-backed page, or a new feature that spans server and client.
---

# Feature scaffolding

Build the layers in this order. Each step names the file and the template to copy. Rules (limits, boundaries, naming) are in `CLAUDE.md`.

Skip steps 1–4 for a UI-only component with no data.

## 1. DTO — `lib/shared/types/<domain>.ts`

```typescript
export type MyFeatureDTO = {
  id: string;
  title: string;
  createdAt: string; // ISO 8601, never Date
  note: string | null; // explicit null, never undefined
};

export type MyFeatureListResponseDTO = { body: MyFeatureDTO[] };
```

Add `export * from "./<domain>";` to `lib/shared/types/index.ts` if the file is new.

## 2. Server function — `lib/server/<domain>/index.ts`

```typescript
import prisma from "@/lib/prisma";
import type { MyFeatureDTO } from "@/lib/shared/types";

/**
 * Lists my-feature items for a cineforum, newest first.
 */
export async function getMyFeatureItems(
  cineforumId: string,
): Promise<MyFeatureDTO[]> {
  const rows = await prisma.myModel.findMany({
    where: { cineforumId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true, note: true },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
    note: r.note,
  }));
}
```

Business failures: throw a coded error, never an HTTP status.

```typescript
const error: Error & { code?: string; details?: unknown } = new Error(
  "Round cannot be closed",
);
error.code = "ROUND_NOT_READY";
throw error;
```

## 3. API route — one file per method

```
pages/api/cineforum/[cineforumId]/my-feature/
├── index.ts        GET
├── create.ts       POST
└── [id]/
    ├── update.ts   PUT
    └── delete.ts   DELETE
```

```typescript
// pages/api/cineforum/[cineforumId]/my-feature/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getMyFeatureItems } from "@/lib/server/my-feature";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { cineforumId } = req.query;
  if (typeof cineforumId !== "string")
    return res.status(400).json({ error: "Invalid cineforumId" });

  const membership = await prisma.membership.findUnique({
    where: { userId_cineforumId: { userId: session.user.id, cineforumId } },
  });
  if (!membership || membership.disabled)
    return res.status(403).json({ error: "Forbidden" });

  // Admin-only routes add:
  // if (!["ADMIN", "OWNER"].includes(membership.role))
  //   return res.status(403).json({ error: "Admin access required" });

  try {
    const body = await getMyFeatureItems(cineforumId);
    return res.status(200).json({ body });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; details?: unknown };
    if (err?.code === "ROUND_NOT_READY")
      return res.status(400).json({ error: err.message, details: err.details });
    console.error("Error in GET /api/cineforum/[cineforumId]/my-feature:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

(Drop the commented admin block in real code; it's here only as a template.)

## 4. Client function — `lib/client/cineforum/<domain>.ts`

```typescript
import { jsonFetch } from "@/lib/client/https";
import type { MyFeatureListResponseDTO } from "@/lib/shared/types";

/**
 * Fetches my-feature items for a cineforum.
 */
export async function fetchMyFeatureItems(
  cineforumId: string,
): Promise<MyFeatureListResponseDTO> {
  return jsonFetch<MyFeatureListResponseDTO>(
    `/api/cineforum/${cineforumId}/my-feature`,
  );
}
```

Add `export * from "./<domain>";` to `lib/client/cineforum/index.ts` if the file is new. No hooks or state in these files.

## 5. Component — `components/cineforum/<feature>/`

```typescript
// components/cineforum/my-feature/MyFeatureCard.tsx
import type { MyFeatureDTO } from "@/lib/shared/types";

type MyFeatureCardProps = { item: MyFeatureDTO };

export default function MyFeatureCard({ item }: MyFeatureCardProps) {
  return (
    <div className="cine-card p-4 flex items-center gap-3">
      <p className="text-foreground font-semibold">{item.title}</p>
    </div>
  );
}
```

With several components, add `index.ts`: `export { default as MyFeatureCard } from "./MyFeatureCard";`. UI patterns: the `frontend-components` skill.

## 6. Page — `pages/cineforum/[cineforumId]/<feature>.tsx`

```typescript
import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import { fetchMyFeatureItems } from "@/lib/client/cineforum";
import CineforumLayout from "@/components/CineforumLayout";
import { EmptyState, LoadingCard } from "@/components/cineforum/common";
import { MyFeatureCard } from "@/components/cineforum/my-feature";
import type { MyFeatureDTO } from "@/lib/shared/types";

type MyFeaturePageProps = { cineforumId: string; cineforumName: string };

export default function MyFeaturePage({
  cineforumId,
  cineforumName,
}: MyFeaturePageProps) {
  const { t } = useTranslation("cineforum");
  const [items, setItems] = useState<MyFeatureDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetchMyFeatureItems(cineforumId);
      setItems(response.body);
    } catch (error) {
      console.error("Error loading my-feature items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [cineforumId]);

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      {loading ? (
        <LoadingCard text={t("myFeature.loading")} />
      ) : items.length === 0 ? (
        <EmptyState title={t("myFeature.emptyTitle")} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <MyFeatureCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  getCineforumLayoutProps(ctx);
```

Need extra SSR data? Use the extended form, and keep it small:

```typescript
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps)
    return cineforumProps;
  const { cineforumId } = cineforumProps.props as { cineforumId: string };
  const extra = await getSmallFirstRenderData(cineforumId);
  return { props: { ...cineforumProps.props, extra } };
};
```

Add new translation keys to both `locales/it/` and `locales/en/`.

## Done when

- [ ] DTO exported from `lib/shared/types/index.ts`
- [ ] Server fn maps to the DTO, has JSDoc, uses `select`
- [ ] One route file per method, correct guard order, no raw Prisma objects
- [ ] Client fn typed via `jsonFetch<T>` and exported from the barrel
- [ ] Page handles loading → empty → data, uses `getCineforumLayoutProps`
- [ ] `npx tsc --noEmit` clean
