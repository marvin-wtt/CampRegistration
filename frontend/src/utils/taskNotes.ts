// Task notes are plain text with a tiny list syntax: "- item" is a bullet,
// "- [ ] item" / "- [x] item" a checklist entry. Everything else is text.

export interface ChecklistItem {
  text: string;
  checked: boolean;
  line: number;
}

export type NoteBlock =
  | { kind: 'text'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'checklist'; items: ChecklistItem[] };

export type ListKind = 'bullets' | 'checklist';

const CHECK_RE = /^\s*(?:[-*]\s+)?\[([ xX])\]\s?(.*)$/;
const BULLET_RE = /^\s*[-*•]\s+(.*)$/;

export const LIST_PREFIX: Record<ListKind, string> = {
  bullets: '- ',
  checklist: '- [ ] ',
};

export function parseLine(
  line: string,
):
  | { kind: 'checklist'; text: string; checked: boolean }
  | { kind: 'bullets'; text: string }
  | { kind: 'text'; text: string } {
  const check = CHECK_RE.exec(line);
  if (check) {
    return {
      kind: 'checklist',
      checked: check[1] !== ' ',
      text: check[2] ?? '',
    };
  }
  const bullet = BULLET_RE.exec(line);
  if (bullet) {
    return { kind: 'bullets', text: bullet[1] ?? '' };
  }
  return { kind: 'text', text: line };
}

export function parseNotes(notes: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];

  notes.split('\n').forEach((line, index) => {
    const parsed = parseLine(line);
    const last = blocks.at(-1);

    if (parsed.kind === 'checklist') {
      const item = { text: parsed.text, checked: parsed.checked, line: index };
      if (last?.kind === 'checklist') {
        last.items.push(item);
      } else {
        blocks.push({ kind: 'checklist', items: [item] });
      }
    } else if (parsed.kind === 'bullets') {
      if (last?.kind === 'bullets') {
        last.items.push(parsed.text);
      } else {
        blocks.push({ kind: 'bullets', items: [parsed.text] });
      }
    } else if (last?.kind === 'text') {
      last.text += `\n${line}`;
    } else {
      blocks.push({ kind: 'text', text: line });
    }
  });

  // Blank lines around lists are spacing, not content.
  return blocks
    .map((block) =>
      block.kind === 'text'
        ? { ...block, text: block.text.replace(/^\n+|\n+$/g, '') }
        : block,
    )
    .filter((block) => block.kind !== 'text' || block.text.trim() !== '');
}

export function toggleChecklistLine(notes: string, line: number): string {
  const lines = notes.split('\n');
  const target = lines[line];
  if (target === undefined) {
    return notes;
  }

  lines[line] = target.replace(/\[([ xX])\]/, (_match, mark: string) =>
    mark === ' ' ? '[x]' : '[ ]',
  );

  return lines.join('\n');
}

export function checklistProgress(
  notes: string | null,
): { done: number; total: number } | null {
  if (!notes) {
    return null;
  }

  const items = parseNotes(notes).flatMap((block) =>
    block.kind === 'checklist' ? block.items : [],
  );
  if (items.length === 0) {
    return null;
  }

  return {
    done: items.filter((item) => item.checked).length,
    total: items.length,
  };
}

// Strips any list prefix from a line, then applies the given one.
export function setLinePrefix(line: string, kind: ListKind | null): string {
  const parsed = parseLine(line);
  const text = parsed.kind === 'text' ? line.trimStart() : parsed.text;

  return kind ? LIST_PREFIX[kind] + text : text;
}
