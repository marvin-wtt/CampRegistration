import {
  type ItemValue,
  type LocalizableString,
  type MatrixDropdownColumn,
  type PageModel,
  type PanelModel,
  type Question,
  QuestionBooleanModel,
  QuestionMatrixDropdownModel,
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

// A fixed-row matrix stores its answers per row: `{ row: { column: … } }`.
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
  return Object.fromEntries(
    question.choices.map((choice: ItemValue) => [
      String(choice.value),
      translations(choice.locText, choice.text),
    ]),
  );
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
  const question = findFormQuestion(new SurveyModel(form), field);

  return question ? getQuestionOptions(question) : undefined;
}
