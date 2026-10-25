import { describe, expect, it } from 'vitest';
import { missingSlotFiles } from '@/utils/fileSlotCoverage';

const file = (
  field: string | null,
  locale: string | null = null,
  group: string | null = null,
) => ({ field, locale, group });

const groups = { locales: ['de', 'fr'], groups: ['de', 'fr'] };

describe('missingSlotFiles', () => {
  it('reports a group without a file of its own or for every group', () => {
    const missing = missingSlotFiles([file('terms', null, 'de')], groups);

    expect(missing).toEqual([{ slot: 'terms', group: 'fr', locale: null }]);
  });

  it('lets a file for every group cover a group without its own', () => {
    expect(missingSlotFiles([file('terms')], groups)).toEqual([]);
  });

  it("never lets a file for every group fill a gap in a group's own files", () => {
    const missing = missingSlotFiles(
      [file('terms', 'de', 'de'), file('terms', 'fr')],
      groups,
    );

    expect(missing).toEqual([
      { slot: 'terms', group: 'de', locale: 'fr' },
      // The other group falls back to the file for every group.
      { slot: 'terms', group: 'fr', locale: 'de' },
    ]);
  });

  it('reports missing languages per group', () => {
    const missing = missingSlotFiles(
      [file('terms', 'de', 'de'), file('terms', 'fr', 'fr')],
      groups,
    );

    expect(missing).toEqual([
      { slot: 'terms', group: 'de', locale: 'fr' },
      { slot: 'terms', group: 'fr', locale: 'de' },
    ]);
  });

  it('checks only languages on a single-group event', () => {
    const missing = missingSlotFiles([file('terms', 'de', 'de')], {
      locales: ['de', 'fr'],
      groups: ['de'],
    });

    expect(missing).toEqual([{ slot: 'terms', group: null, locale: 'fr' }]);
  });

  it('ignores files outside a slot', () => {
    expect(missingSlotFiles([file(null, 'de')], groups)).toEqual([]);
  });
});
