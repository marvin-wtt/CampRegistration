import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import fse from 'fs-extra';
import prisma from '../client.js';
import config from '#config/index';
import { StorageRegistry } from '#core/storage/storage.registry';
import type { StorageFile } from '#core/storage/storage';
import { ulid } from '#utils/ulid';

/**
 * Copies stored files from one storage backend to another and repoints the
 * matching `File` rows at the target.
 *
 * Run with tsx, like the other Prisma scripts:
 *
 *   tsx prisma/scripts/transfer-storage.ts <source> <target> [options]
 *
 *   <source> / <target>   storage identifiers: `disk` or `s3`
 *
 * Options:
 *   --delete-source       remove each file from the source once it has been
 *                         copied and its rows repointed
 *   --dry-run             report what would happen without touching storage/DB
 *
 * The physical bytes are streamed source -> configured tmp dir -> target using
 * the same `Storage` methods the app uses (`openReadStream` + `moveToStorage`),
 * so every provider transfers through one code path. Files that already exist
 * in the target are not re-uploaded — only their rows are repointed — which
 * makes the script safe to re-run after an interruption.
 */

const KNOWN_STORAGES = new Set(['disk', 's3']);

interface Options {
  source: string;
  target: string;
  deleteSource: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const positional: string[] = [];
  let deleteSource = false;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--delete-source') {
      deleteSource = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option "${arg}"`);
    } else {
      positional.push(arg);
    }
  }

  const [source, target] = positional;
  if (!source || !target) {
    throw new Error(
      'Usage: transfer-storage.ts <source> <target> [--delete-source] [--dry-run]',
    );
  }

  if (!KNOWN_STORAGES.has(source)) {
    throw new Error(`Unknown source storage "${source}"`);
  }
  if (!KNOWN_STORAGES.has(target)) {
    throw new Error(`Unknown target storage "${target}"`);
  }
  if (source === target) {
    throw new Error('Source and target storage must differ');
  }

  return { source, target, deleteSource, dryRun };
}

interface FileGroup {
  name: string;
  sample: StorageFile;
  rowCount: number;
}

/**
 * Distinct physical files (`name`) currently held in the source, each with a
 * representative row used to read the bytes and to describe the upload.
 */
async function loadSourceGroups(source: string): Promise<FileGroup[]> {
  const rows = await prisma.file.findMany({
    where: {
      storageLocation: source,
      uploadStatus: 'READY',
    },
    select: {
      id: true,
      name: true,
      originalName: true,
      type: true,
      encryption: true,
    },
    orderBy: { name: 'asc' },
  });

  const groups = new Map<string, FileGroup>();
  for (const row of rows) {
    const existing = groups.get(row.name);
    if (existing) {
      existing.rowCount += 1;
      continue;
    }

    groups.set(row.name, {
      name: row.name,
      rowCount: 1,
      sample: {
        id: row.id,
        originalName: row.originalName,
        name: row.name,
        field: null,
        size: 0,
        type: row.type,
        accessLevel: null,
        storageLocation: source,
        encryption: row.encryption,
      },
    });
  }

  return [...groups.values()];
}

async function stageToTmp(stream: NodeJS.ReadableStream): Promise<string> {
  const tmpFileName = `${ulid()}.transfer`;
  const tmpPath = path.join(config.storage.tmpDir, tmpFileName);

  await fse.ensureDir(config.storage.tmpDir);
  await pipeline(stream, fse.createWriteStream(tmpPath));

  return tmpFileName;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const registry = new StorageRegistry(config.storage);
  const sourceStorage = registry.getStorage(options.source);
  const targetStorage = registry.getStorage(options.target);

  const [groups, targetNames] = await Promise.all([
    loadSourceGroups(options.source),
    targetStorage.getFileNames(),
  ]);
  const existingInTarget = new Set(targetNames);

  console.log(
    `Transferring ${groups.length.toString()} file(s) from "${options.source}" to "${options.target}"` +
      (options.dryRun ? ' (dry run)' : ''),
  );

  let copied = 0;
  let alreadyPresent = 0;
  let repointedRows = 0;
  let deleted = 0;
  let failed = 0;

  for (const group of groups) {
    try {
      const inTarget = existingInTarget.has(group.name);

      if (options.dryRun) {
        console.log(
          `[dry-run] ${group.name} -> ${
            inTarget ? 'already in target' : 'copy'
          }, repoint ${group.rowCount.toString()} row(s)` +
            (options.deleteSource ? ', delete source' : ''),
        );
        continue;
      }

      if (inTarget) {
        alreadyPresent += 1;
      } else {
        const readStream = await sourceStorage.openReadStream(group.sample);
        let tmpFileName: string | undefined;
        try {
          tmpFileName = await stageToTmp(readStream);
          await targetStorage.moveToStorage({
            id: group.sample.id,
            name: group.name,
            originalName: group.sample.originalName,
            type: group.sample.type,
            tmpFileName,
          });
        } catch (error) {
          // moveToStorage consumes the staged file on success; clean up only
          // when it did not get that far.
          if (tmpFileName) {
            await fse
              .remove(path.join(config.storage.tmpDir, tmpFileName))
              .catch(() => undefined);
          }
          throw error;
        }
        copied += 1;
      }

      // Repoint every row that pointed at the source copy.
      const updated = await prisma.file.updateMany({
        where: {
          name: group.name,
          storageLocation: options.source,
        },
        data: { storageLocation: options.target },
      });
      repointedRows += updated.count;

      if (options.deleteSource) {
        await sourceStorage.removeFile(group.name);
        deleted += 1;
      }

      console.log(
        `${inTarget ? 'linked' : 'copied'} ${group.name} (${group.rowCount.toString()} row(s))`,
      );
    } catch (error) {
      failed += 1;
      console.error(`Failed to transfer ${group.name}:`, error);
    }
  }

  console.log(
    options.dryRun
      ? 'Dry run complete.'
      : `Done. copied=${copied.toString()} already-present=${alreadyPresent.toString()} ` +
          `rows-repointed=${repointedRows.toString()} source-deleted=${deleted.toString()} failed=${failed.toString()}`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error('Storage transfer failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
