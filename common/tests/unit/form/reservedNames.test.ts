import { describe, expect, it } from 'vitest';
import {
  reservedNameIssue,
  reservedNameUses,
} from '../../../src/form/index.js';

describe('reservedNameIssue', () => {
  it('accepts ordinary names', () => {
    expect(reservedNameIssue('first_name')).toBeNull();
    expect(reservedNameIssue('events')).toBeNull();
  });

  it('keeps the underscore for the platform', () => {
    expect(reservedNameIssue('_file')).toBe('underscore');
    expect(reservedNameIssue('_mine')).toBe('underscore');
  });

  it('refuses a dot, which would split the answer path', () => {
    expect(reservedNameIssue('kids.meds')).toBe('separator');
  });

  it('refuses the root of the event variables, in any case', () => {
    expect(reservedNameIssue('event')).toBe('variable');
    expect(reservedNameIssue('Event')).toBe('variable');
  });
});

describe('reservedNameUses', () => {
  it('finds reserved names wherever an answer is keyed', () => {
    const form = {
      pages: [
        {
          elements: [
            { type: 'text', name: 'ok', valueName: '_hidden' },
            {
              type: 'panel',
              name: 'group',
              elements: [{ type: 'text', name: 'event' }],
            },
            {
              type: 'paneldynamic',
              name: 'kids',
              templateElements: [{ type: 'text', name: 'a.b' }],
            },
            {
              type: 'matrixdynamic',
              name: 'list',
              columns: [{ name: '_col' }],
            },
          ],
        },
      ],
    };

    expect(reservedNameUses(form)).toEqual([
      { name: '_hidden', issue: 'underscore' },
      { name: 'event', issue: 'variable' },
      { name: 'a.b', issue: 'separator' },
      { name: '_col', issue: 'underscore' },
    ]);
  });

  it('skips panel names, which key no answer', () => {
    expect(
      reservedNameUses({
        elements: [{ type: 'panel', name: 'event', elements: [] }],
      }),
    ).toEqual([]);
  });

  it('finds nothing in a form without reserved names', () => {
    expect(
      reservedNameUses({ elements: [{ type: 'text', name: 'name' }] }),
    ).toEqual([]);
    expect(reservedNameUses(null)).toEqual([]);
  });
});
