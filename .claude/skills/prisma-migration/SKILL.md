---
name: prisma-migration
description: Change the Prisma schema safely — migration creation, the --create-only backfill flow, data migrations, and the ordering rule that makes NOT NULL columns tricky. Use whenever backend/prisma/schema.prisma changes or a migration needs editing.
---

# Prisma schema changes

## The rules that bite

1. **Never edit a migration that has already been applied.** It rewrites history
   for every database that ran it. A PreToolUse hook asks before any write under
   `prisma/migrations/` for this reason.
2. **Data migrations run after _all_ schema migrations of a deploy.**
   `npm run migrate` is `prisma migrate deploy` followed by
   `tsx prisma/data-migrations/runner.ts`. So a column **cannot** be backfilled by
   a data migration and made `NOT NULL` by a schema migration in the same release —
   by the time the data migration runs, the `NOT NULL` constraint has already
   failed. For that case the backfill must be hand-written SQL inside the schema
   migration itself (step below).
3. Primary keys are ULID strings (26 chars), never integers. Multilingual fields
   are JSON columns.

## Normal change

```bash
npx prisma migrate dev --name <descriptive_name>   # from backend/
```

## Adding a NOT NULL column to a populated table

Only the `--create-only` flow works:

```bash
npx prisma migrate dev --create-only --name <descriptive_name>
```

Then edit the generated `migration.sql` **before it is first applied** — add the
column as nullable, `UPDATE` the rows, then `ALTER` it to `NOT NULL` — and apply it
with `npx prisma migrate dev`. Hand-written SQL added at this point is fine; the
prohibition is on editing a migration that has already run.

## Data migrations (transforming rows)

Read `backend/prisma/data-migrations/README.md` first — it is the authority. In
short: a `migration.ts` exporting `up(tx)`, co-located in the
`prisma/migrations/<timestamp>_<name>/` folder it belongs to, run at most once per
database and recorded in `_data_migrations`. Use the plain `tx` (no soft-delete
extension, so deleted rows are visible) and don't open your own `$transaction` —
the runner already wraps one. If there's no schema change to host it, create an
empty migration: `prisma migrate dev --create-only --name <name>`.

## Verifying

```bash
npx prisma migrate diff --exit-code \
  --from-migrations prisma/migrations --to-schema prisma/schema.prisma
```

This is the CI `verify-migrations` gate — it fails when the migrations don't
reproduce the schema. CI uses **MySQL 8** as the shadow database, not MariaDB:
Prisma's `mysql` provider models native JSON, while MariaDB aliases JSON to
LONGTEXT and reports a spurious "type changed" on every JSON column.

`npm run db:reset --workspace backend` is `prisma db push --force-reset` — it drops
the database. The destructive-command hook will ask first; don't reach for it to
work around a migration problem.
