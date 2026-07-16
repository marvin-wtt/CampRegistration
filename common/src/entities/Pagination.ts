export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface CursorMeta {
  /** Cursor to pass on the next request; `null` when the last page was reached. */
  nextCursor: string | null;
  limit: number;
  /** Total number of matching rows. Only returned for the first (uncursored) page. */
  total?: number;
}

export interface CursorPaginated<T> {
  data: T[];
  meta: CursorMeta;
}
