import { describe, expect, it } from 'vitest';
import {
  chunkIntoRows,
  columnsForWidth,
  GRID_GAP,
  MIN_CARD_WIDTH,
} from '@/components/events/eventGrid';

describe('columnsForWidth', () => {
  it('never drops below one column, however narrow', () => {
    expect(columnsForWidth(0)).toBe(1);
    expect(columnsForWidth(120)).toBe(1);
    expect(columnsForWidth(MIN_CARD_WIDTH - 1)).toBe(1);
  });

  it('adds a column exactly when one more card plus its gutter fits', () => {
    // Two cards need both card widths and the single gutter between them.
    const twoCards = MIN_CARD_WIDTH * 2 + GRID_GAP;

    expect(columnsForWidth(twoCards - 1)).toBe(1);
    expect(columnsForWidth(twoCards)).toBe(2);
  });

  it('scales to the usual breakpoints', () => {
    expect(columnsForWidth(600)).toBe(2);
    expect(columnsForWidth(900)).toBe(3);
    expect(columnsForWidth(1200)).toBe(4);
  });
});

describe('chunkIntoRows', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('fills every row but the last', () => {
    expect(chunkIntoRows(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('produces one row per item in a single column', () => {
    expect(chunkIntoRows(items, 1)).toEqual([
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
    ]);
  });

  it('keeps everything in one row when the column count exceeds the item count', () => {
    expect(chunkIntoRows(items, 10)).toEqual([items]);
  });

  it('returns nothing for an empty list', () => {
    expect(chunkIntoRows([], 3)).toEqual([]);
  });

  it('treats a nonsensical column count as a single column rather than looping forever', () => {
    expect(chunkIntoRows(items, 0)).toHaveLength(items.length);
  });
});
