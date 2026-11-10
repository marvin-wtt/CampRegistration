import {
  type ItemValue,
  type Question,
  QuestionBooleanModel,
  QuestionSelectBase,
  SurveyModel,
} from 'survey-core';
import {
  TABLE_COMPUTED_FIELDS,
  TABLE_META_FIELDS,
  type Registration,
  type TableColumnTemplate,
  type TableTemplate,
} from '../entities/index.js';
import { collectStoredFields } from './fields.js';

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
const WILDCARD = '*';

// Everything a row has, beyond what the column picker offers.
const ROW_FIELDS = [
  ...TABLE_META_FIELDS,
  'id',
  'locale',
  'updatedAt',
] as const satisfies readonly (keyof Registration)[];
const COMPUTED_FIELDS = [...TABLE_COMPUTED_FIELDS, 'phoneNumbers.*'];

// An array index reads the same field as the wildcard does.
function normalize(path: string): string {
  return path
    .split('.')
    .map((key) => (/^\d+$/.test(key) ? WILDCARD : key))
    .join('.');
}

// A known field also covers its parents, e.g. `address` for `address.city`.
function pathSet(paths: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const path of paths) {
    const keys = path.split('.');
    for (let i = 1; i <= keys.length; i++) {
      set.add(keys.slice(0, i).join('.'));
    }
  }

  return set;
}

function withoutWildcard(path: string): string {
  return path.endsWith(`.${WILDCARD}`) ? path.slice(0, -2) : path;
}

// The values a question can store, or undefined when any value is possible.
function closedValues(question: Question): Set<string> | undefined {
  if (question instanceof QuestionBooleanModel) {
    return new Set([
      String(question.valueTrue ?? true),
      String(question.valueFalse ?? false),
    ]);
  }

  if (
    !(question instanceof QuestionSelectBase) ||
    question.choices.length === 0 ||
    question.hasOther ||
    question.isUsingRestful ||
    question.choicesFromQuestion
  ) {
    return undefined;
  }

  const values = question.choices.map((choice: ItemValue) =>
    String(choice.value),
  );
  if (question.hasNone) {
    values.push(String(question.noneItem.value));
  }

  return new Set(values);
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
  if (key === WILDCARD) {
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
  private readonly questions = new Map<string, Question>();
  private readonly computedFields = pathSet(COMPUTED_FIELDS);
  private readonly rowFields = new Set<string>(ROW_FIELDS);
  private readonly usage = new Map<string, number>();

  constructor(
    form: object,
    private readonly registrations: readonly object[] = [],
  ) {
    const model = new SurveyModel(form);
    const paths: string[] = [];

    for (const { value, question } of collectStoredFields(model)) {
      paths.push(value);
      for (const path of [value, withoutWildcard(value)]) {
        if (!this.questions.has(path)) {
          this.questions.set(path, question);
        }
      }
      if (hasComment(question)) {
        paths.push(withoutWildcard(value) + model.commentSuffix);
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
    const issues = template.columns.flatMap((column) =>
      this.checkColumn(column),
    );

    const sortBy = template.sortBy;
    if (sortBy && !template.columns.some((column) => column.name === sortBy)) {
      issues.push({ code: 'sort/unknown', column: sortBy });
    }

    return issues;
  }

  checkColumn(column: TableColumnTemplate): TableTemplateIssue[] {
    const { name, field } = column;
    if (!field || FREE_PREFIXES.some((prefix) => field.startsWith(prefix))) {
      return [];
    }

    const path = normalize(field);
    if (!this.knowsField(path)) {
      return [
        {
          code: 'field/unknown',
          column: name,
          field,
          ...this.inUse(path),
        },
      ];
    }

    if (!path.startsWith(FORM_PREFIX)) {
      return [];
    }

    const question = this.questions.get(path.slice(FORM_PREFIX.length));
    const allowed = question ? closedValues(question) : undefined;
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
        ...this.inUse(path, value),
      }));
  }

  private knowsField(path: string): boolean {
    if (path.startsWith(FORM_PREFIX)) {
      return this.formFields.has(path.slice(FORM_PREFIX.length));
    }
    if (path.startsWith(COMPUTED_PREFIX)) {
      return this.computedFields.has(path.slice(COMPUTED_PREFIX.length));
    }

    return this.rowFields.has(path);
  }

  // How many registrations hold the path, or that value at it.
  private inUse(path: string, value?: string): { registrations?: number } {
    const key = value === undefined ? path : `${path}\u0000${value}`;
    let count = this.usage.get(key);
    if (count === undefined) {
      const keys = path.split('.');
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
