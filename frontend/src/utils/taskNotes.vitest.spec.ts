import { describe, expect, it } from 'vitest';
import {
  checklistProgress,
  parseNotes,
  setLinePrefix,
  toggleChecklistLine,
} from '@/utils/taskNotes';

const shopping = [
  'Buy for the BBQ:',
  '- [ ] Bread',
  '- [x] Sausages',
  '',
  '- Ask the kitchen first',
  '* Keep the receipt',
].join('\n');

describe('parseNotes', () => {
  it('groups lines into text, checklist and bullet blocks', () => {
    expect(parseNotes(shopping)).toEqual([
      { kind: 'text', text: 'Buy for the BBQ:' },
      {
        kind: 'checklist',
        items: [
          { text: 'Bread', checked: false, line: 1 },
          { text: 'Sausages', checked: true, line: 2 },
        ],
      },
      { kind: 'bullets', items: ['Ask the kitchen first', 'Keep the receipt'] },
    ]);
  });

  it('keeps plain notes as a single text block', () => {
    expect(parseNotes('Line one\n\nLine two')).toEqual([
      { kind: 'text', text: 'Line one\n\nLine two' },
    ]);
  });
});

describe('toggleChecklistLine', () => {
  it('flips only the given line', () => {
    const toggled = toggleChecklistLine(shopping, 1);
    expect(toggled.split('\n')[1]).toBe('- [x] Bread');
    expect(toggleChecklistLine(toggled, 2).split('\n')[2]).toBe(
      '- [ ] Sausages',
    );
  });
});

describe('checklistProgress', () => {
  it('counts checked items', () => {
    expect(checklistProgress(shopping)).toEqual({ done: 1, total: 2 });
  });

  it('is null without a checklist', () => {
    expect(checklistProgress('- just bullets')).toBeNull();
    expect(checklistProgress(null)).toBeNull();
  });
});

describe('setLinePrefix', () => {
  it('switches and removes list prefixes', () => {
    expect(setLinePrefix('Milk', 'checklist')).toBe('- [ ] Milk');
    expect(setLinePrefix('- [x] Milk', 'bullets')).toBe('- Milk');
    expect(setLinePrefix('- Milk', null)).toBe('Milk');
  });
});
