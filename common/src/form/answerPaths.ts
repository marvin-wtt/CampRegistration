import {
  MatrixDropdownRowModelBase,
  MatrixDynamicRowModel,
  QuestionPanelDynamicModel,
  type Question,
} from 'survey-core';

/**
 * The one notation for where an answer lives in a response: keys joined by
 * dots, a number for an entry of a list (`kids.1.meds`), `*` for every entry
 * (`kids.*.meds`). A dropdown matrix stores its rows by name
 * (`matrix.row.column`), so a numeric key may also be a row named like one.
 * Table columns, consent texts, purge checks, error messages and change mails
 * all write it.
 */
export const PATH_SEPARATOR = '.';
export const PATH_WILDCARD = '*';

const WILDCARD_SUFFIX = `${PATH_SEPARATOR}${PATH_WILDCARD}`;

export function joinPath(
  ...keys: (string | number | null | undefined)[]
): string {
  return keys
    .filter((key) => key !== null && key !== undefined && key !== '')
    .map(String)
    .join(PATH_SEPARATOR);
}

export function withoutWildcard(path: string): string {
  return path.endsWith(WILDCARD_SUFFIX)
    ? path.slice(0, -WILDCARD_SUFFIX.length)
    : path;
}

/**
 * The spellings a concrete path can be known under in a form: each numeric
 * key either as itself (a row named `1`) or as `*` (an entry index).
 */
export function pathPatterns(path: string): string[] {
  return path.split(PATH_SEPARATOR).reduce<string[]>(
    (prefixes, key) => {
      const keys = /^\d+$/.test(key) ? [key, PATH_WILDCARD] : [key];
      return prefixes.flatMap((prefix) => keys.map((k) => joinPath(prefix, k)));
    },
    [''],
  );
}

/**
 * The value at a path; `*` reads every entry of a list, flattened into one
 * list. Undefined where the path leads nowhere.
 */
export function valueAtPath(
  path: string | readonly string[],
  value: unknown,
): unknown {
  const keys = typeof path === 'string' ? path.split(PATH_SEPARATOR) : path;
  let result = value;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (result == null) {
      return undefined;
    }

    if (key === PATH_WILDCARD) {
      if (!Array.isArray(result)) {
        return undefined;
      }
      const rest = keys.slice(i + 1);
      return result.flatMap((entry: unknown) => valueAtPath(rest, entry));
    }

    if (typeof result !== 'object' || !(key in result)) {
      return undefined;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result;
}

/** Every non-empty value at a path, a list's entries each on their own. */
export function valuesAtPath(path: string, value: unknown): unknown[] {
  const found = valueAtPath(path, value);

  return (Array.isArray(found) ? found : [found]).filter(
    (entry) => entry != null && entry !== '',
  );
}

/**
 * Where a live question's answer is stored: `kids.1.consent` in the second
 * entry of a dynamic panel, `matrix.0.column` in a dynamic matrix row,
 * `matrix.row.column` in a named one; nested containers prefix their own.
 */
export function answerPathOf(question: Question): string {
  const name = question.getValueName();
  // Typed as always set, but null for a question that is not nested.
  const parent = question.parentQuestion as Question | null;
  if (!parent) {
    return name;
  }

  const parentPath = answerPathOf(parent);
  const row: unknown = question.data;

  if (parent instanceof QuestionPanelDynamicModel) {
    const index = parent.panels.findIndex((panel) =>
      panel.questions.includes(question),
    );
    return joinPath(parentPath, index, name);
  }
  if (row instanceof MatrixDynamicRowModel) {
    return joinPath(parentPath, row.rowIndex - 1, name);
  }
  if (row instanceof MatrixDropdownRowModelBase) {
    return joinPath(parentPath, String(row.rowName), name);
  }

  return joinPath(parentPath, name);
}
