import {
  type ItemValue,
  type LocalizableString,
  type MatrixDropdownColumn,
  type PageModel,
  type PanelModel,
  type Question,
  QuestionBooleanModel,
  QuestionMatrixDropdownModel,
  QuestionMatrixDynamicModel,
  QuestionMatrixModel,
  QuestionPanelDynamicModel,
  QuestionSelectBase,
  SurveyModel,
} from 'survey-core';

interface SelectData {
  label: string;
  value: string;
}

export interface FormField extends SelectData {
  question: Question;
}

const WILDCARD = '*';
const SEPARATOR = '.';

function removeMarkdownUrls(input: string): string {
  // Regular expression to match Markdown URLs
  const markdownUrlRegex = /\[([^\]]+)]\(([^)]+)\)/g;

  return input.replace(
    markdownUrlRegex,
    (_match, linkText: string) => linkText,
  );
}

const ARRAY_OUTPUT_TYPES = new Set([
  'tagbox',
  'checkbox',
  'ranking',
  'matrixdynamic',
  'paneldynamic',
  'imagepicker',
  'file',
]);

const IGNORED_TYPES = new Set(['expression', 'html']);
// Types that store no answer at all.
const STORELESS_TYPES = new Set(['html', 'image']);

function buildLabelAndValue(
  question: Question,
  parentName?: string,
  parentTitle?: string,
): { label: string; value: string } {
  const titleParts = [parentTitle, question.title].filter(Boolean);
  const nameParts = [parentName, question.getValueName()].filter(Boolean);

  if (ARRAY_OUTPUT_TYPES.has(question.getType())) {
    titleParts.push(WILDCARD);
    nameParts.push(WILDCARD);
  }

  return {
    label: removeMarkdownUrls(titleParts.join(' > ')),
    value: nameParts.join(SEPARATOR),
  };
}

// Matrix cells, read from the columns: a matrix's rows (and so its nested
// questions) only exist once it has some. A fixed-row matrix stores its
// answers per row (`{ row: { column: … } }`), a dynamic one per entry.
function matrixRowFields(
  question: Question,
  label: string,
  value: string,
): FormField[] {
  if (question instanceof QuestionMatrixDropdownModel) {
    return (question.rows as ItemValue[]).flatMap((row) =>
      (question.columns as MatrixDropdownColumn[]).map((column) => ({
        label: `${label} > ${row.text} > ${column.title}`,
        value: [value, String(row.value), column.name].join(SEPARATOR),
        question: column.templateQuestion,
      })),
    );
  }

  if (question instanceof QuestionMatrixDynamicModel) {
    return (question.columns as MatrixDropdownColumn[]).map((column) => ({
      label: `${label} > ${column.title}`,
      value: [value, column.name].join(SEPARATOR),
      question: column.templateQuestion,
    }));
  }

  if (question instanceof QuestionMatrixModel) {
    return (question.rows as ItemValue[]).map((row) => ({
      label: `${label} > ${row.text}`,
      value: [value, String(row.value)].join(SEPARATOR),
      question,
    }));
  }

  return [];
}

function collectFields(
  question: Question,
  ignored: ReadonlySet<string>,
  parentName?: string,
  parentTitle?: string,
): FormField[] {
  if (ignored.has(question.getType())) {
    return [];
  }

  // Use page title as default parent title
  parentTitle ??= (question.page as PageModel | undefined)?.title;

  const { label, value } = buildLabelAndValue(
    question,
    parentName,
    parentTitle,
  );

  const rowFields = matrixRowFields(question, label, value);
  const nested =
    rowFields.length > 0
      ? rowFields
      : getNestedQuestions(question).flatMap((child) =>
          collectFields(child, ignored, value, label),
        );

  return [{ label, value, question }, ...nested];
}

function getNestedQuestions(question: Question): Question[] {
  if (question instanceof QuestionPanelDynamicModel) {
    return question.template.questions.flatMap((q) =>
      q.getNestedQuestions(false, true, true),
    );
  }

  return question.getNestedQuestions();
}

export function extractFormFields(form: object, prefix?: string): SelectData[] {
  return new SurveyModel(form)
    .getAllQuestions()
    .flatMap((q) => collectFields(q, IGNORED_TYPES, prefix))
    .map(({ label, value }) => ({ label, value }));
}

/** Every field the form stores an answer under, calculated ones included. */
export function collectStoredFields(model: SurveyModel): FormField[] {
  return model
    .getAllQuestions()
    .flatMap((q) => collectFields(q, STORELESS_TYPES));
}

/**
 * The question behind each stored field path. An array field (`tags.*`) is
 * also reachable without its wildcard, as a column of the whole array.
 */
export function buildFieldIndex(model: SurveyModel): Map<string, Question> {
  const index = new Map<string, Question>();
  for (const { value, question } of collectStoredFields(model)) {
    const target =
      (question.questionWrapper as Question | undefined) ?? question;
    for (const path of [value, withoutWildcard(value)]) {
      if (!index.has(path)) {
        index.set(path, target);
      }
    }
  }

  return index;
}

export function withoutWildcard(path: string): string {
  return path.endsWith(`${SEPARATOR}${WILDCARD}`) ? path.slice(0, -2) : path;
}

export function extractEventDataTypes(form: object): string[] {
  const survey = new SurveyModel(form);
  const tags = new Set<string>();

  for (const question of survey.getAllQuestions(false, undefined, true)) {
    const tag: unknown = question.getPropertyValue('eventDataType');
    if (typeof tag === 'string') {
      tags.add(tag);
    }
  }

  return [...tags];
}

function getNestedQuestion(
  question: Question | null | undefined,
  path: string[],
): Question | undefined {
  for (const key of path) {
    if (!question) {
      return undefined;
    }

    if (key === WILDCARD) {
      continue;
    }

    if (IGNORED_TYPES.has(question.getType())) {
      return undefined;
    }

    // Without data a dynamic panel has no panels, only its template.
    if (question instanceof QuestionPanelDynamicModel) {
      const panel =
        (question.getPanels()[0] as PanelModel | undefined) ??
        question.template;
      question = panel.getQuestionByValueName(key);
      continue;
    }

    question = question
      .getNestedQuestions()
      .find((value) => value.getValueName() === key);
  }

  // Special handling for custom questions
  if (question?.questionWrapper) {
    return question.questionWrapper as Question;
  }

  return question ?? undefined;
}

function translations(
  text: LocalizableString | undefined,
  fallback: string,
): string | Record<string, string> {
  const json = text?.getJson() as string | Record<string, string> | undefined;

  return json ?? fallback;
}

function getBooleanOptions(
  question: QuestionBooleanModel,
): Record<string, string | Record<string, string>> {
  return {
    [String(question.valueTrue ?? true)]: translations(
      question.locLabelTrue as LocalizableString | undefined,
      question.labelTrue,
    ),
    [String(question.valueFalse ?? false)]: translations(
      question.locLabelFalse as LocalizableString | undefined,
      question.labelFalse,
    ),
  };
}

function getQuestionOptions(
  question: Question,
): Record<string, string | Record<string, string>> | undefined {
  if (question instanceof QuestionBooleanModel) {
    return getBooleanOptions(question);
  }

  // Covers every choice-based type (dropdown, tagbox, checkbox, ranking, …).
  if (
    !(question instanceof QuestionSelectBase) ||
    question.choices.length === 0
  ) {
    return undefined;
  }

  // `choices` is always normalised to ItemValue instances.
  const items = [
    ...(question.choices as ItemValue[]),
    ...specialItems(question),
  ];

  return Object.fromEntries(
    items.map((item) => [
      String(item.value),
      translations(item.locText, item.text),
    ]),
  );
}

// Items the question shows beside its choices, each storing its own value.
function specialItems(question: QuestionSelectBase): ItemValue[] {
  return [
    question.hasOther && question.otherItem,
    question.hasNone && question.noneItem,
    question.showRefuseItem && question.refuseItem,
    question.showDontKnowItem && question.dontKnowItem,
  ].filter((item): item is ItemValue => item !== false);
}

// Whether a select question can store values its items don't list.
function acceptsAnyValue(question: QuestionSelectBase): boolean {
  return (
    question.isUsingRestful ||
    !!question.choicesFromQuestion ||
    // Typed "other" text is stored as the value itself.
    (question.hasOther && !question.getStoreOthersAsComment()) ||
    question.getPropertyValue('allowCustomChoices') === true ||
    // Checkbox answers stored as objects, not values.
    !!question.getPropertyValue('valuePropertyName')
  );
}

/** The values a question can store, or undefined when any value is possible. */
export function storedValues(question: Question): Set<string> | undefined {
  if (question instanceof QuestionSelectBase && acceptsAnyValue(question)) {
    return undefined;
  }

  const options = getQuestionOptions(question);

  return options ? new Set(Object.keys(options)) : undefined;
}

function findFormQuestion(
  model: SurveyModel,
  field: string,
): Question | undefined {
  const [firstField, ...parts] = field.split(SEPARATOR) as [
    string,
    ...string[],
  ];

  return getNestedQuestion(model.getQuestionByValueName(firstField), parts);
}

export function getSelectOptions(
  form: object,
  field: string,
): Record<string, string | Record<string, string>> | undefined {
  const model = new SurveyModel(form);
  // The walk also resolves paths that leave out a dynamic panel's wildcard.
  const question =
    buildFieldIndex(model).get(field) ?? findFormQuestion(model, field);

  return question ? getQuestionOptions(question) : undefined;
}
