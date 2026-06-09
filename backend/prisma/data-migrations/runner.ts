import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

/**
 * Idempotent, tracked data-migration runner.
 *
 * Run with tsx (like the other Prisma scripts in this project) after
 * `prisma migrate deploy` on every deploy. It:
 *  1. ensures a `_data_migrations` tracking table exists,
 *  2. on first creation, seeds the baselined (manually-applied) migration names,
 *  3. discovers data migrations co-located in the Prisma migrations directory
 *     (`prisma/migrations/<name>/migration.ts`) and runs every one that has not
 *     been applied yet, recording each in the same transaction so partial
 *     failures roll back.
 *
 * A data migration sits next to the schema migration it belongs to; the
 * migration folder name is its identity. Only *pending* migrations are imported,
 * so the legacy self-running scripts (which are baselined) are never executed.
 *
 * Uses a plain (non-soft-delete-extended) Prisma client so migrations can see
 * and modify every row, matching the previous standalone migration scripts.
 */

const TRACKING_TABLE = '_data_migrations';
const MIGRATIONS_DIR = path.join(import.meta.dirname, '..', 'migrations');

/**
 * Data migrations applied **manually** before this runner existed (the legacy
 * self-running `migration.ts` scripts). Recorded as already-applied the first
 * time the tracking table is created, so they are never re-run; they would be
 * no-ops on a fresh database anyway.
 *
 * New migrations are discovered automatically — do not list them here.
 */
const baselinedMigrations = [
  '20260121175357_update_message_templates_add_country_column',
  '20260124022616_update_registrations_replace_waitinglist_with_status',
];

interface MigrationModule {
  up?: (tx: Prisma.TransactionClient) => Promise<void>;
}

async function discoverMigrationNames(): Promise<string[]> {
  if (!existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(path.join(MIGRATIONS_DIR, entry.name, 'migration.ts')),
    )
    .map((entry) => entry.name)
    .sort();
}

async function loadMigration(
  name: string,
): Promise<(tx: Prisma.TransactionClient) => Promise<void>> {
  const file = path.join(MIGRATIONS_DIR, name, 'migration.ts');
  const mod = (await import(pathToFileURL(file).href)) as MigrationModule;

  if (typeof mod.up !== 'function') {
    throw new Error(
      `Data migration "${name}/migration.ts" must export an \`up\` function.`,
    );
  }

  return mod.up;
}

async function trackingTableExists(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ${TRACKING_TABLE}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

async function ensureTrackingTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`${TRACKING_TABLE}\` (
      \`name\` VARCHAR(255) NOT NULL,
      \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`name\`)
    )
  `);
}

async function getAppliedNames(): Promise<Set<string>> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT \`name\` FROM \`${TRACKING_TABLE}\``,
  );
  return new Set(rows.map((r) => r.name));
}

async function markApplied(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<void> {
  await tx.$executeRaw`INSERT INTO \`_data_migrations\` (\`name\`) VALUES (${name})`;
}

async function main(): Promise<void> {
  const existedBefore = await trackingTableExists();
  await ensureTrackingTable();

  // Seed baselined migrations the first time the table is created so that
  // migrations applied manually before this runner are never re-run.
  if (!existedBefore && baselinedMigrations.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const name of baselinedMigrations) {
        await markApplied(tx, name);
      }
    });
    console.log(
      `Baselined ${baselinedMigrations.length.toString()} previously-applied data migration(s).`,
    );
  }

  const applied = await getAppliedNames();
  const discovered = await discoverMigrationNames();
  const pending = discovered.filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log(
      `No pending data migrations (${discovered.length.toString()} discovered).`,
    );
    return;
  }

  for (const name of pending) {
    console.log(`Applying data migration: ${name}`);
    const up = await loadMigration(name);
    await prisma.$transaction(async (tx) => {
      await up(tx);
      await markApplied(tx, name);
    });
    console.log(`Applied data migration: ${name}`);
  }

  console.log(`Applied ${pending.length.toString()} data migration(s).`);
}

main()
  .catch((e: unknown) => {
    console.error('Data migration failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
