# Data migrations

Data migrations transform existing rows (schema changes belong in the regular
Prisma migration `migration.sql`). They are **co-located with the schema
migration they belong to**: a file named `migration.ts` inside a
`prisma/migrations/<timestamp>_<name>/` folder.

`runner.ts` (run via `npm run data:migrate`, after `prisma migrate deploy`)
discovers every `prisma/migrations/*/migration.ts`, runs the ones not yet applied
in folder-name order, and records each in the `_data_migrations` table so it runs
at most once per database.

## Adding one

Create `migration.ts` in the relevant migration folder, exporting an `up`
function (this is the format the runner expects — not a standalone script):

```ts
import type { Prisma } from '#generated/prisma/client.js';

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  // Transform rows via `tx`. Write defensively: this may run against a fresh
  // database where there is nothing to change. It runs inside a transaction and
  // is recorded as applied atomically, so throwing rolls everything back.
}
```

If a data migration has no associated schema change, create an empty migration to
host it: `prisma migrate dev --create-only --name <descriptive_name>`.

## Notes

- The migration **folder name** is the migration's identity.
- Each migration runs **at most once** per database.
- Use the plain transaction client `tx` — the soft-delete extension is not applied
  here, so deleted rows are visible. Do **not** wrap your work in your own
  `$transaction`; the runner already does.
- The two existing `migration.ts` scripts predate this runner and are
  **baselined** (recorded as applied the first time the tracking table is
  created, so they are never imported or re-run). They already use the
  `export up` format, so importing them would be safe even if baselining were
  removed.
