import { describe, expect, it } from 'vitest';
import { spreadWithinTies, shuffleTiedRuns } from '#utils/ordering';

describe('shuffleTiedRuns', () => {
  it('keeps the order between runs', () => {
    const items = [1, 1, 1, 2, 2, 3];
    for (let i = 0; i < 20; i++) {
      expect(shuffleTiedRuns(items, (a, b) => a === b)).toEqual(items);
    }
  });

  it('shuffles within a run', () => {
    const items = ['a1', 'a2', 'a3', 'b1'];
    const sameLetter = (a: string, b: string) => a[0] === b[0];
    const results = new Set(
      Array.from({ length: 50 }, () =>
        shuffleTiedRuns(items, sameLetter).join(),
      ),
    );

    expect(results.size).toBeGreaterThan(1);
    for (const result of results) {
      expect(result.endsWith('b1')).toBe(true);
    }
  });
});

describe('spreadWithinTies', () => {
  const group = (item: string) => item.slice(0, 2);
  const rank = (item: string) => Number(item.at(-1));
  const tied = (a: string, b: string) => rank(a) === rank(b);

  it('alternates groups within a tie', () => {
    expect(spreadWithinTies(['de1', 'de1', 'fr1', 'fr1'], tied, group)).toEqual(
      ['de1', 'fr1', 'de1', 'fr1'],
    );
  });

  it('never moves an item ahead of a better-ranked one', () => {
    expect(spreadWithinTies(['de1', 'de1', 'fr2'], tied, group)).toEqual([
      'de1',
      'de1',
      'fr2',
    ]);
  });

  it('continues from the seeded counts', () => {
    expect(
      spreadWithinTies(['de1', 'fr1'], tied, group, new Map([['de', 1]])),
    ).toEqual(['fr1', 'de1']);
  });
});
