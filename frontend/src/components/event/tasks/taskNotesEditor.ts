import { watch, type Ref, type ShallowRef } from 'vue';
import type { Editor, Extensions } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Markdown } from '@tiptap/markdown';

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

// Task notes are stored as GitHub-flavoured Markdown. The editor and the
// read-only view share this setup so both read a note the same way.
export function taskNotesExtensions(
  checkboxLabel: (text: string) => string = (text) => text,
  canTick: () => boolean = () => true,
): Extensions {
  return [
    StarterKit.configure({
      // Markdown has no underline; a trailing paragraph would add a blank line.
      underline: false,
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        isAllowedUri: (url, { defaultValidate }) =>
          SAFE_URL.test(url) && defaultValidate(url),
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
      // Keeps a read-only tick instead of reverting it; `applyReadOnlyCheck`
      // then writes it into the document.
      onReadOnlyChecked: () => canTick(),
      a11y: { checkboxLabel: (node) => checkboxLabel(node.textContent) },
    }),
    // `breaks`: a single newline is a line break, as in GitHub issues.
    Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
  ];
}

// With `breaks` on, a plain newline already is a line break; drop the two
// trailing spaces TipTap writes for one so stored notes stay clean.
export function notesMarkdown(editor: {
  isEmpty: boolean;
  getMarkdown: () => string;
}): string {
  return editor.isEmpty ? '' : editor.getMarkdown().replace(/ {2}\n/g, '\n');
}

// In a read-only editor TipTap only flips the checkbox element, the document
// keeps the old state, so no update fires and nothing would be saved.
export function applyReadOnlyCheck(
  editor: Editor,
  checkbox: HTMLInputElement,
): void {
  const content = checkbox.closest('li')?.querySelector(':scope > div');
  if (editor.isEditable || !content) {
    return;
  }

  const { state, view } = editor;
  const $pos = state.doc.resolve(view.posAtDOM(content, 0));
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === 'taskItem') {
      view.dispatch(
        state.tr.setNodeMarkup($pos.before(depth), undefined, {
          ...node.attrs,
          checked: checkbox.checked,
        }),
      );
      return;
    }
  }
}

/**
 * Two-way sync between a notes editor and its `v-model`. Outside values are
 * applied unless `canApply` says no (e.g. while the user is typing); `sync`
 * catches up on them once it says yes again.
 */
export function useNotesModel(
  editor: ShallowRef<Editor | undefined>,
  model: Ref<string> | Ref<string | null | undefined>,
  canApply: () => boolean = () => true,
) {
  // The value the editor currently shows, so its own updates aren't echoed.
  let shown = model.value;

  function sync() {
    const value = model.value;
    if (value === shown || !canApply()) {
      return;
    }
    shown = value;
    editor.value?.commands.setContent(value ?? '', {
      contentType: 'markdown',
      emitUpdate: false,
    });
  }

  watch(model, sync);

  function onUpdate(instance: Parameters<typeof notesMarkdown>[0]) {
    shown = notesMarkdown(instance);
    model.value = shown;
  }

  return { onUpdate, sync };
}
