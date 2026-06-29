import { describe, expect, it } from 'vitest';
import {
  changedKeysByAllowList,
  changedKeysExcept,
  changedLeafPaths,
  composeChangedFields,
} from '#app/audit/audit.diff';

describe('changedKeysByAllowList', () => {
  it('only reports allow-listed keys that changed', () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { a: 1, b: 99, c: 99 };

    expect(changedKeysByAllowList(before, after, ['a', 'b'])).toEqual(['b']);
  });

  it('reports a key set from absent', () => {
    expect(changedKeysByAllowList({}, { a: 5 }, ['a'])).toEqual(['a']);
  });

  it('treats null and absent as equal (no phantom change)', () => {
    expect(changedKeysByAllowList({ a: null }, {}, ['a'])).toEqual([]);
  });

  it('returns nothing for deep-equal values', () => {
    expect(
      changedKeysByAllowList({ a: { x: 1 } }, { a: { x: 1 } }, ['a']),
    ).toEqual([]);
  });

  it('tolerates null/undefined operands', () => {
    expect(changedKeysByAllowList(null, undefined, ['a'])).toEqual([]);
  });
});

describe('changedKeysExcept', () => {
  it('reports changed keys except the deny-list, iterating `before`', () => {
    const before = { price: 100, themes: 'a', updatedAt: 1 };
    const after = { price: 120, themes: 'b', updatedAt: 2 };

    expect(changedKeysExcept(before, after, ['themes', 'updatedAt'])).toEqual([
      'price',
    ]);
  });
});

describe('changedLeafPaths', () => {
  it('flattens nested objects to prefixed dot-paths', () => {
    const before = { person: { name: 'Ann', age: 10 } };
    const after = { person: { name: 'Bob', age: 10 } };

    expect(changedLeafPaths(before, after, 'data')).toEqual([
      'data.person.name',
    ]);
  });

  it('treats arrays as leaf values', () => {
    expect(
      changedLeafPaths(
        { emails: ['a@x.com'] },
        { emails: ['a@x.com', 'b'] },
        'data',
      ),
    ).toEqual(['data.emails']);
  });

  it('detects added and removed leaves but ignores null/absent flips', () => {
    expect(
      changedLeafPaths({ a: 1, n: null }, { b: 2 }, 'data').sort(),
    ).toEqual(['data.a', 'data.b']);
  });

  it('traces arrays of objects positionlessly with a `*` segment', () => {
    const before = { contacts: [{ name: 'Ann', phone: '1' }] };
    const after = { contacts: [{ name: 'Bob', phone: '1' }] };

    expect(changedLeafPaths(before, after, 'data')).toEqual([
      'data.contacts.*.name',
    ]);
  });

  it('treats row reordering in an array of objects as no change', () => {
    const before = { contacts: [{ name: 'Ann' }, { name: 'Bob' }] };
    const after = { contacts: [{ name: 'Bob' }, { name: 'Ann' }] };

    expect(changedLeafPaths(before, after, 'data')).toEqual([]);
  });

  it('reports the affected sub-path when a row is added', () => {
    const before = { contacts: [{ name: 'Ann' }] };
    const after = { contacts: [{ name: 'Ann' }, { name: 'Bob' }] };

    expect(changedLeafPaths(before, after, 'data')).toContain(
      'data.contacts.*.name',
    );
  });
});

describe('composeChangedFields', () => {
  it('merges, de-duplicates and sorts', () => {
    expect(
      composeChangedFields(['status'], ['data.b', 'data.a'], ['status']),
    ).toEqual(['data.a', 'data.b', 'status']);
  });
});
