import { ZipArchive } from 'archiver';
import { once } from 'node:events';
import type { Readable, Writable } from 'node:stream';

export interface ZipEntry {
  name: string;
  /** Opened only when the archive gets to it. */
  open: () => Promise<Readable>;
}

/**
 * Streams the entries into `output` as a ZIP, one open file at a time.
 * Entries are stored, not compressed: photos and PDFs don't shrink.
 */
export async function streamZip(
  output: Writable,
  entries: ZipEntry[],
): Promise<void> {
  const archive = new ZipArchive({ store: true });
  const failed = once(archive, 'error').then(([error]) => {
    throw error;
  });
  archive.pipe(output);

  const work = (async () => {
    for (const entry of entries) {
      const written = once(archive, 'entry');
      archive.append(await entry.open(), { name: entry.name });
      await written;
    }
    await archive.finalize();
  })();

  // An error after the race is settled has no one left to tell.
  failed.catch(() => undefined);
  await Promise.race([work, failed]);
}
