import {
  MatrixDropdownRowModelBase,
  MatrixDynamicRowModel,
  PanelModel,
  QuestionPanelDynamicModel,
  SurveyModel,
} from 'survey-core';
import 'survey-core/i18n/german';
import 'survey-core/i18n/french';
import 'survey-core/i18n/polish';
import 'survey-core/i18n/czech';
import type { IDataIssue, IPanel, PanelModelBase, Question } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import type { EventWithFreePlaces } from '#app/event/event.types';
import { withTimeout } from '#utils/promiseUtils';

/** One field of a form, flattened out of the survey's structure. */
export interface FormAnswer {
  /** Dotted path of the field within the form data. */
  path: string;
  /** Breadcrumb title in the survey's locale, e.g. `Food > Diet`. */
  label: string;
  /** The stored answer, for comparison. */
  value: unknown;
  /** The answer as it should be shown to a reader. */
  displayValue: unknown;
  /** The answer is a stored file reference, never something to print. */
  isFile: boolean;
}

/** A reason the submitted data does not fit the form. */
export interface FormDataError {
  /** Location in the form data, for display only — names are not escaped. */
  path: string;
  message: string;
}

/**
 * The subset of SurveyJS' plain-data entry this module reads. Declared here
 * because `survey-core` does not re-export the interface from its entry point.
 */
interface PlainDataEntry {
  name: string | number;
  title: string;
  value: unknown;
  displayValue: unknown;
  questionType?: string;
  data?: PlainDataEntry[];
}

/**
 * Question types whose plain-data children are distinct sub-questions rather
 * than one entry per selected choice. Only these are descended into: a checkbox
 * reads better as a single "Diet: Vegan, Halal" answer than as one per choice.
 */
const CONTAINER_TYPES = new Set([
  'paneldynamic',
  'matrixdynamic',
  'matrixdropdown',
  'matrix',
  'multipletext',
]);

const FILE_TYPE = 'file';

// How long to wait for a validator calling an async function. No form function
// is async, so this only bounds a fallback.
const ASYNC_VALIDATION_TIMEOUT_MS = 5_000;

const PATH_SEPARATOR = '.';
const LABEL_SEPARATOR = ' > ';

const ISSUE_MESSAGES: Record<IDataIssue['type'], string> = {
  unknownProperty: 'Unknown field',
  invalidValueType: 'Invalid value type',
  invalidChoiceValue: 'Unknown choice',
  expressionResultMismatch: 'Value differs from its computed result',
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// A file question holds one value or a list of them.
const fileValues = (question: Question): unknown[] => {
  const value: unknown = question.value;
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

// The location of a question's value in the form data, in the notation
// `setData()` uses for its issues: `panel[1].question`, `matrix[0].column` for
// a dynamic matrix row, `matrix.row.column` for a named one.
const questionPath = (question: Question): string => {
  const name = question.getValueName();
  const parent = question.parentQuestion;
  // Typed as always set, but null for a question that is not nested.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!parent) {
    return name;
  }

  const parentPath = questionPath(parent);
  const row: unknown = question.data;

  if (parent instanceof QuestionPanelDynamicModel) {
    const index = parent.panels.findIndex((panel) =>
      panel.questions.includes(question),
    );
    return `${parentPath}[${String(index)}].${name}`;
  }
  if (row instanceof MatrixDynamicRowModel) {
    return `${parentPath}[${String(row.rowIndex - 1)}].${name}`;
  }
  if (row instanceof MatrixDropdownRowModelBase) {
    return `${parentPath}.${String(row.rowName)}.${name}`;
  }

  return `${parentPath}.${name}`;
};

function flattenAnswers(
  entries: PlainDataEntry[],
  trail: { path: string; label: string }[],
): FormAnswer[] {
  return entries.flatMap((entry) => {
    const name = String(entry.name);
    // The rows and panels a container expands into are titled generically
    // ("Panel"), so they are numbered instead — "Contacts > #2 > Phone" says
    // where the answer sits, "Contacts > Panel > Phone" does not.
    const title =
      typeof entry.name === 'number'
        ? `#${String(entry.name + 1)}`
        : entry.title || name;

    const nested = [...trail, { path: name, label: title }];

    const children = entry.data;
    const questionType = entry.questionType;

    // A container's own children are distinct sub-questions, and so are the
    // entries of the structural row/panel nodes it expands into, which carry no
    // question type of their own. Everything else — a checkbox listing one child
    // per selected choice, a file listing one per upload — stays a single answer.
    if (
      children?.length &&
      (questionType === undefined || CONTAINER_TYPES.has(questionType))
    ) {
      return flattenAnswers(children, nested);
    }

    return [
      {
        path: nested.map((part) => part.path).join(PATH_SEPARATOR),
        label: nested.map((part) => part.label).join(LABEL_SEPARATOR),
        value: entry.value,
        displayValue: entry.displayValue,
        isFile: questionType === FILE_TYPE,
      },
    ];
  });
}

/**
 * An event's registration form, loaded with one response at a time. The survey
 * is built once per instance, so code that walks many registrations of one
 * event loads each of them into the same form.
 */
export class RegistrationForm {
  private readonly survey: SurveyModel;
  private issues: IDataIssue[] = [];

  // `group` is the country the form is answered for. Without one, only a
  // single-country event knows it — enough to read the answers back.
  constructor(
    event: EventWithFreePlaces,
    options?: { locale?: string; group?: string | null | undefined },
  ) {
    this.survey = new SurveyModel(event.form);

    // SurveyJS resolves `de-DE` to its `de` strings, but not `de_DE`.
    this.survey.locale = (options?.locale ?? 'en-US').replace('_', '-');
    setVariables(this.survey, event, { country: options?.group });
  }

  /** Replaces the response the form holds, running the form's logic on it. */
  load(data: unknown): this {
    this.issues = this.survey.setData(isRecord(data) ? data : {}, {
      reportUnknownProperties: true,
      reportInvalidValueTypes: true,
      reportInvalidChoiceValues: true,
      reportExpressionResultMismatches: false,
    });

    return this;
  }

  /** The response after the form's logic ran — computed values included. */
  get data(): Record<string, unknown> {
    return this.survey.data as Record<string, unknown>;
  }

  /**
   * Everything that makes the response unfit to be stored: the structural
   * issues found while loading it, the form's validation rules and file values
   * that are not references to uploaded files.
   */
  async dataErrors(): Promise<FormDataError[]> {
    const structuralErrors = this.issues.map((issue) => ({
      path: issue.path,
      message: ISSUE_MESSAGES[issue.type],
    }));

    // SurveyJS also accepts file objects (name, type, content) as a file
    // value, but a stored response may only reference uploads by their id.
    const fileErrors = this.fileQuestions()
      .filter((question) =>
        fileValues(question).some((value) => typeof value !== 'string'),
      )
      .map((question) => ({
        path: questionPath(question),
        message: 'Invalid file reference',
      }));

    return [
      ...structuralErrors,
      ...((await this.isValid()) ? [] : this.validationErrors()),
      ...fileErrors,
    ];
  }

  getFileIds(): string[] {
    return this.fileQuestions()
      .flatMap(fileValues)
      .filter((value): value is string => typeof value === 'string' && !!value);
  }

  /** The answers of the questions tagged with an `eventDataType`, by tag. */
  extractEventData(): Record<string, unknown[]> {
    const plain = this.survey.getPlainData({
      includeEmpty: true,
      includeValues: true,
      calculations: [{ propertyName: 'eventDataType' }],
    });

    const eventData: Record<string, unknown[]> = {};
    for (const entry of plain) {
      const tag: unknown = entry.eventDataType;
      if (typeof tag !== 'string' || !tag) {
        continue;
      }

      // Undefined is not accepted by prisma and must be replaced with null
      (eventData[tag] ??= []).push(entry.value ?? null);
    }

    return eventData;
  }

  /**
   * Every answered field, flattened out of the survey's nesting and labelled in
   * the survey's locale. `getPlainData` is what resolves question titles and
   * choice labels, so callers get readable output without a lookup of their own.
   */
  answers(): FormAnswer[] {
    const plain = this.survey.getPlainData({
      includeEmpty: true,
      includeQuestionTypes: true,
    });

    return flattenAnswers(plain, []);
  }

  // Runs the form's own rules (required, validators, ...) and returns whether
  // the response passes them. This, not the errors read afterwards, is the
  // verdict: SurveyJS stores errors on more elements than are read back.
  private async isValid(): Promise<boolean> {
    let settle!: (valid: boolean) => void;
    const asyncVerdict = new Promise<boolean>((resolve) => {
      settle = resolve;
    });

    // Typed as `boolean`, but documented (and observed) to return `undefined`
    // while an async validator is still running.
    const valid = this.survey.validate(
      // `fireCallback`: documented as "show the errors in the UI", but it is
      // what stores them on `errors`, read by `validationErrors()`. SurveyJS
      // also forces it on whenever a callback is passed.
      true,
      // `focusFirstError`
      false,
      // `onAsyncValidation`: only needed when a validator calls an async
      // function, which no form function is. Kept as a fallback for one. Called
      // with whether errors were found, the inverse of the verdict.
      (hasErrors: boolean) => {
        settle(!hasErrors);
      },
    ) as boolean | undefined;

    // Any result other than `undefined` is final: with a synchronous rule
    // already failed, the error of a pending async one may be missing, but the
    // data is rejected either way. A validator that never settles is a fault of
    // the function, not of the data, so it fails the request rather than the
    // data.
    return (
      valid ??
      withTimeout(
        asyncVerdict,
        ASYNC_VALIDATION_TIMEOUT_MS,
        'Async validation of the registration form did not settle',
      )
    );
  }

  // The errors `isValid()` stored, in the survey's locale. Only read once the
  // response failed: warnings are stored alongside and never reject it.
  private validationErrors(): FormDataError[] {
    const errors = [
      ...this.survey.getAllQuestions(true, undefined, true).map((question) => ({
        path: questionPath(question),
        element: question,
      })),
      ...this.panels(),
    ].flatMap(({ path, element }) =>
      element.errors
        .filter((error) => error.isError)
        .map((error) => ({ path, message: error.getText() })),
    );

    // An error stored where none of the above looks still rejects the data.
    return errors.length > 0
      ? errors
      : [{ path: '', message: 'Response does not satisfy the form' }];
  }

  // Every visible panel with where it sits in the form data: a panel owns no
  // data key, so a static one is located by its name — like `FormDataError`
  // paths, for display only — and a dynamic panel's item by its index.
  private panels(): { path: string; element: PanelModel }[] {
    const located = (prefix: string, container: PanelModelBase) => {
      const panels: IPanel[] = [];
      container.addPanelsIntoList(panels, true);

      return panels
        .filter((panel) => panel instanceof PanelModel)
        .map((panel) => ({ path: `${prefix}${panel.name}`, element: panel }));
    };

    const staticPanels = this.survey.pages.flatMap((page) => located('', page));

    const dynamicPanels = this.survey
      .getAllQuestions(true, undefined, true)
      .filter((question) => question instanceof QuestionPanelDynamicModel)
      .flatMap((question) => {
        const path = questionPath(question);

        return question.panels.flatMap((panel, index) => {
          const itemPath = `${path}[${String(index)}]`;

          return [
            { path: itemPath, element: panel },
            ...located(`${itemPath}${PATH_SEPARATOR}`, panel),
          ];
        });
      });

    return [...staticPanels, ...dynamicPanels];
  }

  private fileQuestions(): Question[] {
    return this.survey
      .getAllQuestions(false, undefined, true)
      .filter((question) => question.getType() === FILE_TYPE);
  }
}
