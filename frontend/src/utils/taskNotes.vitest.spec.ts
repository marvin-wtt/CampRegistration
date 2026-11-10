import { describe, expect, it } from 'vitest';
import { checklistProgress } from '@/utils/taskNotes';

describe('checklistProgress', () => {
  it('counts checked items across lists, including nested ones', () => {
    const notes = [
      'Buy for the BBQ:',
      '',
      '- [ ] Bread',
      '- [x] Sausages',
      '  - [X] Mustard',
      '1. [ ] Numbered',
      '- not a task',
    ].join('\n');

    expect(checklistProgress(notes)).toEqual({ done: 2, total: 4 });
  });

  it('ignores items inside code blocks', () => {
    expect(checklistProgress('```\n- [ ] code\n```\n- [x] real')).toEqual({
      done: 1,
      total: 1,
    });
  });

  it('is null without a checklist', () => {
    expect(checklistProgress('- just bullets')).toBeNull();
    expect(checklistProgress('[ ] needs a list marker')).toBeNull();
    expect(checklistProgress(null)).toBeNull();
  });
});
