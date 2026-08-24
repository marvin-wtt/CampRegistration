/** Narrowest a event card may get before the grid drops a column. */
export const MIN_CARD_WIDTH = 270;

/** Gutter between cards, horizontally and between rows. */
export const GRID_GAP = 16;

/**
 * First-paint row height only — QVirtualScroll measures the real heights as rows
 * render and corrects itself, so this just has to be close.
 */
export const ROW_HEIGHT_ESTIMATE = 400;

/**
 * How many cards fit across `width`.
 *
 * The grid cannot use `auto-fill` because the row chunking below has to agree
 * with the CSS exactly, or rows come out ragged — so JS owns the count and CSS
 * follows it.
 */
export function columnsForWidth(width: number): number {
  return Math.max(
    1,
    Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)),
  );
}

/** Splits a flat list into rows of `columns` items, the last row possibly short. */
export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  const size = Math.max(1, columns);
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}
