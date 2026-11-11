import { describe, expect, it } from 'vitest';
import {
  removeById,
  replaceAllById,
  replaceById,
  upsertById,
} from '@/utils/collection';

const a = { id: 'a', v: 1 };
const b = { id: 'b', v: 1 };

describe('collection helpers', () => {
  it('replace an item by id and keep the order', () => {
    expect(replaceById([a, b], { id: 'a', v: 2 })).toEqual([
      { id: 'a', v: 2 },
      b,
    ]);
    expect(replaceAllById([a, b], [{ id: 'b', v: 2 }])).toEqual([
      a,
      { id: 'b', v: 2 },
    ]);
  });

  it('upsert appends a new item', () => {
    expect(upsertById([a], b)).toEqual([a, b]);
  });

  // A reload may already have brought a created item back.
  it('upsert never duplicates an item already in the list', () => {
    expect(upsertById([a, b], { id: 'b', v: 2 })).toEqual([
      a,
      { id: 'b', v: 2 },
    ]);
  });

  it('remove an item by id', () => {
    expect(removeById([a, b], 'a')).toEqual([b]);
  });

  it('return new arrays so watchers see the change', () => {
    const list = [a, b];
    expect(replaceById(list, a)).not.toBe(list);
    expect(upsertById(list, a)).not.toBe(list);
    expect(removeById(list, 'x')).not.toBe(list);
  });
});
