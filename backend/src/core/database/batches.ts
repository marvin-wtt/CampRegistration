/** The paging arguments `batchesById` hands to each read. */
export interface IdPage {
  where: { id?: { gt: string } };
  orderBy: { id: 'asc' };
  take: number;
}

/**
 * Reads a table in batches ordered by id, bounded in memory overall. `read`
 * spreads the page into its `findMany` and merges `page.where` into its own
 * filter. Empty batches are never yielded.
 */
export async function* batchesById<T extends { id: string }>(
  read: (page: IdPage) => Promise<T[]>,
  size: number,
): AsyncGenerator<T[]> {
  let cursor: string | undefined;
  let batch: T[];

  do {
    batch = await read({
      where: cursor ? { id: { gt: cursor } } : {},
      orderBy: { id: 'asc' },
      take: size,
    });
    if (batch.length > 0) {
      yield batch;
    }
    cursor = batch.at(-1)?.id;
  } while (batch.length === size);
}
