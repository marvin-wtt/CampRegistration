import { type Question, QuestionSelectBase, SurveyModel } from 'survey-core';
import {
  TABLE_COMPUTED_FIELDS,
  TABLE_META_FIELDS,
  type Registration,
  type TableColumnTemplate,
  type TableTemplate,
} from '../entities/index.js';
import { buildFieldIndex, storedValues, withoutWildcard } from './fields.js';

/** `registrations` counts those that still hold the field or value. */
export type TableTemplateIssue =
  | {
      code: 'field/unknown';
      column: string;
      field: string;
      registrations?: number;
    }
  | {
      code: 'value/unknown';
      column: string;
      field: string;
      value: string;
      registrations?: number;
    }
  | { code: 'sort/unknown'; column: string };

const FORM_PREFIX = 'data.';
const COMPUTED_PREFIX = 'computedData.';
// Staff-entered: the column itself defines the field.
const FREE_PREFIXES = ['customData.', 'customFiles.'];

// Everything a row has, beyond what the column picker offers.
const ROW_FIELDS = [
  ...TABLE_META_FIELDS,
  'id',
  'locale',
  'updatedAt',
] as const satisfies readonly (keyof Registration)[];
const COMPUTED_FIELDS = [...TABLE_COMPUTED_FIELDS, 'phoneNumbers.*'];

// A known field also covers its parents, e.g. `address` for `address.city`.
function pathSet(paths: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const path of paths) {
    const keys = path.split('.');
    for (let i = 1; i <= keys.length; i++) {
      set.add(keys.slice(0, i).join('.'));
    }
  }

  return set;
}

/**
 * The spellings a path can be known under: a numeric key is either a name
 * (a matrix row `1`) or an array index, read the same as `*`.
 */
function candidates(path: string): string[] {
  return path.split('.').reduce<string[]>(
    (prefixes, key) => {
      const keys = /^\d+$/.test(key) ? [key, '*'] : [key];
      return prefixes.flatMap((prefix) =>
        keys.map((k) => (prefix ? `${prefix}.${k}` : k)),
      );
    },
    [''],
  );
}

function hasComment(question: Question): boolean {
  return (
    question.hasComment ||
    (question instanceof QuestionSelectBase && question.hasOther)
  );
}

function mappedValues(column: TableColumnTemplate): string[] {
  if (column.renderAs !== 'icon_mapping') {
    return [];
  }

  const mappings = column.renderOptions?.mappings;
  if (!Array.isArray(mappings)) {
    return [];
  }

  return mappings.flatMap((mapping: unknown) => {
    const value = (mapping as { value?: unknown } | null)?.value;
    return typeof value === 'string' || typeof value === 'number'
      ? [String(value)]
      : [];
  });
}

// The non-empty values at a path, with `*` reading every array entry.
function valuesAt(value: unknown, keys: readonly string[]): unknown[] {
  if (value == null || value === '') {
    return [];
  }

  if (keys.length === 0) {
    return Array.isArray(value) ? value : [value];
  }

  const [key, ...rest] = keys as [string, ...string[]];
  if (key === '*') {
    return Array.isArray(value)
      ? value.flatMap((entry: unknown) => valuesAt(entry, rest))
      : [];
  }
  if (typeof value !== 'object') {
    return [];
  }

  return valuesAt((value as Record<string, unknown>)[key], rest);
}

/**
 * Finds table template references the event's form can't satisfy: fields it
 * doesn't store and icon-mapped values none of its choices store. Expressions
 * (`filter`, `showIf`, `hideIf`) aren't checked. With registrations given, an
 * issue counts those that still hold the field or value from an older form.
 */
export class TableTemplateReferenceChecker {
  private readonly formFields: Set<string>;
  private readonly questions: Map<string, Question>;
  private readonly computedFields = pathSet(COMPUTED_FIELDS);
  private readonly rowFields = new Set<string>(ROW_FIELDS);
  private readonly usage = new Map<string, number>();

  constructor(
    form: object,
    private readonly registrations: readonly object[] = [],
  ) {
    const model = new SurveyModel(form);
    this.questions = buildFieldIndex(model);

    const paths = [...this.questions.keys()];
    for (const [path, question] of this.questions) {
      if (hasComment(question)) {
        paths.push(withoutWildcard(path) + model.commentSuffix);
      }
    }
    for (const calculated of model.calculatedValues) {
      if (calculated.includeIntoResult) {
        paths.push(calculated.name);
      }
    }

    this.formFields = pathSet(paths);
  }

  check(template: Pick<TableTemplate, 'columns' | 'sortBy'>) {
    return [
      ...template.columns.flatMap((column) => this.checkColumn(column)),
      ...this.checkSort(template),
    ];
  }

  checkSort(
    template: Pick<TableTemplate, 'columns' | 'sortBy'>,
  ): TableTemplateIssue[] {
    const sortBy = template.sortBy;
    if (!sortBy || template.columns.some((column) => column.name === sortBy)) {
      return [];
    }

    return [{ code: 'sort/unknown', column: sortBy }];
  }

  checkColumn(column: TableColumnTemplate): TableTemplateIssue[] {
    const { name, field } = column;
    if (!field || FREE_PREFIXES.some((prefix) => field.startsWith(prefix))) {
      return [];
    }

    if (!this.knowsField(field)) {
      return [
        { code: 'field/unknown', column: name, field, ...this.inUse(field) },
      ];
    }

    if (!field.startsWith(FORM_PREFIX)) {
      return [];
    }

    const question = candidates(field.slice(FORM_PREFIX.length))
      .map((path) => this.questions.get(path))
      .find((entry) => entry !== undefined);
    const allowed = question ? storedValues(question) : undefined;
    if (!allowed) {
      return [];
    }

    return mappedValues(column)
      .filter((value) => !allowed.has(value))
      .map((value) => ({
        code: 'value/unknown',
        column: name,
        field,
        value,
        ...this.inUse(field, value),
      }));
  }

  private knowsField(field: string): boolean {
    const [known, path] = field.startsWith(FORM_PREFIX)
      ? [this.formFields, field.slice(FORM_PREFIX.length)]
      : field.startsWith(COMPUTED_PREFIX)
        ? [this.computedFields, field.slice(COMPUTED_PREFIX.length)]
        : [this.rowFields, field];

    return candidates(path).some((candidate) => known.has(candidate));
  }

  // How many registrations hold the field, or that value in it.
  private inUse(field: string, value?: string): { registrations?: number } {
    const key = value === undefined ? field : `${field}\u0000${value}`;
    let count = this.usage.get(key);
    if (count === undefined) {
      const keys = field.split('.');
      count = this.registrations.filter((registration) => {
        const values = valuesAt(registration, keys);
        return value === undefined
          ? values.length > 0
          : values.some((entry) => String(entry) === value);
      }).length;
      this.usage.set(key, count);
    }

    return count > 0 ? { registrations: count } : {};
  }
}
