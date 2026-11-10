import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/vue-3';
import {
  applyReadOnlyCheck,
  notesMarkdown,
  taskNotesExtensions,
} from '@/components/event/tasks/taskNotesEditor';

function createEditor(notes: string): Editor {
  return new Editor({
    extensions: taskNotesExtensions(),
    content: notes,
    contentType: 'markdown',
  });
}

function roundTrip(notes: string): string {
  const editor = createEditor(notes);
  const result = notesMarkdown(editor);
  editor.destroy();
  return result;
}

describe('taskNotesExtensions', () => {
  it.each([
    'Buy for the BBQ:\n\n- [ ] Bread\n- [x] Sausages',
    '- Ask the kitchen first\n- Keep the receipt',
    'line one\nline two',
    '**Bold**, *italic* and ~~gone~~',
    '[Shop](https://example.com)',
    '- [ ] outer\n  - [ ] inner',
  ])('round-trips %j', (notes) => {
    expect(roundTrip(notes)).toBe(notes);
  });

  it('never renders unsafe links', () => {
    const editor = createEditor('[x](javascript:alert(1))');
    expect(editor.getHTML()).not.toContain('javascript:');
    editor.destroy();
  });
});

describe('applyReadOnlyCheck', () => {
  it('writes a read-only tick into the document and emits an update', () => {
    const updates: string[] = [];
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: taskNotesExtensions(),
      content: '- [ ] Bread\n- [ ] Sausages\n  - [ ] Mustard',
      contentType: 'markdown',
      editable: false,
      onUpdate: ({ editor }) => updates.push(notesMarkdown(editor)),
    });

    const checkboxes =
      editor.view.dom.querySelectorAll<HTMLInputElement>('input');
    const nested = checkboxes[2];
    expect(nested).toBeDefined();
    if (nested) {
      nested.checked = true;
      applyReadOnlyCheck(editor, nested);
    }

    expect(updates).toEqual(['- [ ] Bread\n- [ ] Sausages\n  - [x] Mustard']);
    editor.destroy();
  });
});
