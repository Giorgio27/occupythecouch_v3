---
name: db-change
description: Safe procedure for changing the OccupyTheCouch v3 Prisma schema or data — additive-only changes, local Docker Postgres first, backfill scripts, and the production checklist. The Vercel Postgres database holds real data that must never be erased. Use before editing prisma/schema.prisma, writing a backfill or data script, or running any prisma db/migrate command or npm run db:* script.
---

# Database changes

## The one rule

**Production (Vercel Postgres) holds real club data: users, rounds, votes, rankings. Nothing may delete, reset or overwrite it.** There are no Prisma migrations and no automatic backups in this repo. A lost table is lost.

Assume `DATABASE_URL` points at production. Never read `.env` to check.

**Claude never runs a command that connects to a database**, local or production. Claude edits the schema and writes scripts, then gives the user the exact commands to run, in order, and waits for their output. Claude may run only the offline commands: `npx prisma format`, `npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`.

## Never (not even suggested without a backup and an explicit reason)

- `npm run db:clear` (`scripts/db/clear-database.ts` runs `deleteMany` on every table)
- `npm run db:import` (Mongo → Postgres import, meant for an empty DB)
- `prisma migrate reset`, `prisma migrate dev` (may offer to reset on drift), `prisma db push --force-reset`, `prisma db push --accept-data-loss`
- `deleteMany({})`, `TRUNCATE`, `DROP` in scripts or `prisma db execute`
- Dropping, renaming or narrowing a column/table, or changing a column type, in one step

## Allowed changes (additive)

- New table
- New column that is **nullable** or has a **`@default`**
- New index, new optional relation
- New enum value (appended)

Removing or renaming happens in phases: add the new field → backfill → ship code reading the new field → only later, with the user's explicit OK and a fresh backup, drop the old one.

## Procedure

Claude does steps 1–3 and 5; every database step is a suggestion for the user.

1. Edit `prisma/schema.prisma` with an additive change.
2. `npx prisma format && npx prisma validate`
3. `npx prisma generate`, then `npx tsc --noEmit`
4. **Suggest** a local try: the user starts `docker compose -f docker-compose.postgres.yml up -d`, points `DATABASE_URL` at `localhost:5432`, runs `npx prisma db push`, and checks the feature.
5. If existing rows need values, write a backfill in `scripts/db/<verb>-<what>.ts` (see `backfill-user-created-at.ts`):
   - idempotent: only touches rows still missing the value (`where: { field: null }`)
   - batched (`updateMany`, or chunks of ~500), never one giant transaction (Prisma Accelerate caps interactive transactions at 15s)
   - logs counts with `console.info`; has a dry-run mode that prints what it would change
   - add an `npm run db:<name>` script
6. Hand the user the production checklist below, with the exact commands filled in.

## Production checklist (for the user)

- [ ] Backup first: `npm run db:export` (or a Vercel/Neon snapshot)
- [ ] `npx prisma db push` against prod; Prisma must **not** warn about data loss. If it does, stop.
- [ ] Run the backfill in dry-run, check the counts, then for real
- [ ] Deploy the code that uses the new field
- [ ] Spot-check the affected pages on production
