// Task notes are GitHub-flavoured Markdown; checklist items are list items
// starting with "[ ]" or "[x]".
const TASK_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\](?:\s|$)/;
const FENCE = /^\s*(```|~~~)/;

export function checklistProgress(
  notes: string | null,
): { done: number; total: number } | null {
  if (!notes) {
    return null;
  }

  let done = 0;
  let total = 0;
  let inCode = false;

  for (const line of notes.split('\n')) {
    if (FENCE.test(line)) {
      inCode = !inCode;
      continue;
    }

    const match = inCode ? null : TASK_ITEM.exec(line);
    if (match) {
      total++;
      if (match[1] !== ' ') {
        done++;
      }
    }
  }

  return total > 0 ? { done, total } : null;
}
