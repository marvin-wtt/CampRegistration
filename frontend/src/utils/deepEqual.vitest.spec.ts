import { describe, expect, it } from 'vitest';
import { isDeepEqual } from '@/utils/deepEqual';

describe('isDeepEqual', () => {
  it('ignores key order', () => {
    expect(isDeepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(
      true,
    );
  });

  it('treats an undefined key as absent', () => {
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
  });

  it('compares arrays in order', () => {
    expect(isDeepEqual([1, 2], [1, 2])).toBe(true);
    expect(isDeepEqual([1, 2], [2, 1])).toBe(false);
    expect(isDeepEqual([1], { 0: 1 })).toBe(false);
  });

  it('tells null, undefined and empty values apart', () => {
    expect(isDeepEqual(null, undefined)).toBe(false);
    expect(isDeepEqual({}, null)).toBe(false);
    expect(isDeepEqual('', 0)).toBe(false);
  });

  it('compares dates by time', () => {
    expect(isDeepEqual(new Date(0), new Date(0))).toBe(true);
    expect(isDeepEqual(new Date(0), new Date(1))).toBe(false);
  });
});
