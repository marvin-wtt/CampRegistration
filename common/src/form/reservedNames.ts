import { FILE_VARIABLE } from './files.js';
import { VARIABLE_NAMES } from './variables/index.js';
import { PATH_SEPARATOR } from './answerPaths.js';

/**
 * Why a name can't key an answer: answers share one namespace with the
 * variables the platform sets, which keep `_` and the roots of theirs
 * (`event`, `_file`), and a dot would split the answer's path.
 */
export type ReservedNameIssue = 'underscore' | 'separator' | 'variable';

// Expressions look names up case-insensitively.
const VARIABLE_ROOTS = new Set(
  [...VARIABLE_NAMES, FILE_VARIABLE].map((name) =>
    (name.split(PATH_SEPARATOR)[0] ?? name).toLowerCase(),
  ),
);

export function reservedNameIssue(name: string): ReservedNameIssue | null {
  if (name.startsWith('_')) {
    return 'underscore';
  }
  if (name.includes(PATH_SEPARATOR)) {
    return 'separator';
  }

  return VARIABLE_ROOTS.has(name.toLowerCase()) ? 'variable' : null;
}

export interface ReservedNameUse {
  name: string;
  issue: ReservedNameIssue;
}

interface ElementJson {
  name?: unknown;
  valueName?: unknown;
  elements?: unknown;
  templateElements?: unknown;
  columns?: unknown;
}

function asElements(value: unknown): ElementJson[] {
  return Array.isArray(value)
    ? value.filter(
        (element): element is ElementJson =>
          !!element && typeof element === 'object',
      )
    : [];
}

/**
 * The names in a form's JSON that key an answer and are reserved: those of
 * questions, panels' and matrices' nested questions, and matrix columns.
 * Read off the JSON, so a form the editor can't load yet is checked too.
 */
export function reservedNameUses(form: unknown): ReservedNameUse[] {
  const uses: ReservedNameUse[] = [];
  if (!form || typeof form !== 'object') {
    return uses;
  }

  const check = (value: unknown) => {
    const issue =
      typeof value === 'string' && value ? reservedNameIssue(value) : null;
    if (issue) {
      uses.push({ name: value as string, issue });
    }
  };

  const walk = (elements: ElementJson[]) => {
    for (const element of elements) {
      check(element.name);
      check(element.valueName);
      walk(asElements(element.elements));
      walk(asElements(element.templateElements));
      walk(asElements(element.columns));
    }
  };

  const json = form as { pages?: unknown; elements?: unknown };
  for (const page of asElements(json.pages)) {
    walk(asElements(page.elements));
  }
  walk(asElements(json.elements));

  return uses;
}
