import { describe, expect, it } from 'vitest';
import {
  diffByAllowList,
  diffLeaves,
  pickSnapshot,
  composeChangeSet,
  isEmptyChangeSet,
} from '#app/audit/audit.diff';

describe('diffByAllowList', () => {
  it('only reports changes for allow-listed keys', () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { a: 1, b: 99, c: 99 };

    const result = diffByAllowList(before, after, ['a', 'b']);

    expect(result).toEqual({ b: { from: 2, to: 99 } });
    expect(result).not.toHaveProperty('c');
  });

  it('treats missing values as null', () => {
    const result = diffByAllowList({}, { a: 5 }, ['a']);
    expect(result).toEqual({ a: { from: null, to: 5 } });
  });

  it('returns no change for deep-equal values', () => {
    const before = { a: { x: 1 } };
    const after = { a: { x: 1 } };
    expect(diffByAllowList(before, after, ['a'])).toEqual({});
  });

  it('tolerates null/undefined operands', () => {
    expect(diffByAllowList(null, undefined, ['a'])).toEqual({});
  });
});

describe('diffLeaves', () => {
  it('flattens nested objects to dot-paths', () => {
    const before = { person: { name: 'Ann', age: 10 } };
    const after = { person: { name: 'Bob', age: 10 } };

    expect(diffLeaves(before, after)).toEqual({
      'person.name': { from: 'Ann', to: 'Bob' },
    });
  });

  it('treats arrays as leaf values', () => {
    const before = { emails: ['a@x.com'] };
    const after = { emails: ['a@x.com', 'b@x.com'] };

    expect(diffLeaves(before, after)).toEqual({
      emails: { from: ['a@x.com'], to: ['a@x.com', 'b@x.com'] },
    });
  });

  it('detects added and removed leaves', () => {
    expect(diffLeaves({ a: 1 }, { b: 2 })).toEqual({
      a: { from: 1, to: null },
      b: { from: null, to: 2 },
    });
  });
});

describe('pickSnapshot', () => {
  it('captures the requested keys, defaulting missing ones to null', () => {
    const entity = { status: 'ACCEPTED', data: { a: 1 } };
    expect(pickSnapshot(entity, ['status', 'data', 'missing'])).toEqual({
      status: 'ACCEPTED',
      data: { a: 1 },
      missing: null,
    });
  });
});

describe('composeChangeSet', () => {
  it('omits empty sections', () => {
    expect(composeChangeSet({})).toEqual({});
    expect(composeChangeSet({ a: { from: 1, to: 2 } }, {})).toEqual({
      fields: { a: { from: 1, to: 2 } },
    });
  });

  it('includes both sections when present', () => {
    expect(
      composeChangeSet(
        { status: { from: 'A', to: 'B' } },
        { name: { from: 'x', to: 'y' } },
      ),
    ).toEqual({
      fields: { status: { from: 'A', to: 'B' } },
      data: { name: { from: 'x', to: 'y' } },
    });
  });
});

describe('isEmptyChangeSet', () => {
  it('is true for an empty object and false when sections are present', () => {
    expect(isEmptyChangeSet({})).toBe(true);
    expect(isEmptyChangeSet({ fields: { a: { from: 1, to: 2 } } })).toBe(false);
    expect(isEmptyChangeSet({ snapshot: { a: 1 } })).toBe(false);
  });
});
