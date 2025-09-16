import {
  type PageModel,
  type PanelModel,
  type Question,
  type QuestionSelectBase,
  SurveyModel,
} from 'survey-core';

interface SelectData {
  label: string;
  value: string;
}

const WILDCARD = '*';
const SEPARATOR = '.';

function removeMarkdownUrls(input: string): string {
  // Regular expression to match Markdown URLs
  const markdownUrlRegex = /\[([^\]]+)]\(([^)]+)\)/g;

  return input.replace(markdownUrlRegex, (match, linkText) => {
    return linkText;
  });
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

function buildLabelAndValue(
  question: Question,
  parentName?: string,
  parentTitle?: string,
): { label: string; value: string } {
  const titleParts = [parentTitle, question.title ?? ''].filter(Boolean);
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

function collectSelectData(
  question: Question,
  parentName?: string,
  parentTitle?: string,
): SelectData[] {
  // Skip certain question types (e.g., "expression")
  if (IGNORED_TYPES.has(question.getType())) {
    return [];
  }

  // Use page title as default parent title
  if (!parentTitle) {
    parentTitle = (question.page as PageModel)?.title;
  }

  // Build the primary entry for the current question
  const { label, value } = buildLabelAndValue(
    question,
    parentName,
    parentTitle,
  );
  const result: SelectData[] = [{ label, value }];

  // Collect nested questions if present
  result.push(
    ...question
      .getNestedQuestions()
      .flatMap((child) => collectSelectData(child, value, label)),
  );

  // Special handling for paneldynamic questions without nested questions
  if (question.getType() === 'paneldynamic') {
    result.push(
      ...(question.getPanel() as PanelModel)
        .getQuestions(true)
        .flatMap((child) => collectSelectData(child, value, label)),
    );
  }

  return result;
}

export function extractFormFields(form: object, prefix?: string): SelectData[] {
  const survey = new SurveyModel(form);

  // For each question, recursively collect all SelectData items.
  return survey.getAllQuestions().flatMap((q) => collectSelectData(q, prefix));
}

function getNestedQuestion(
  question: Question | null | undefined,
  path: string[],
): Question | undefined {
  path = [...path]; // Create a copy to avoid mutating the original array

  while (path.length > 0) {
    if (!question) {
      return undefined;
    }

    const key = path.shift()!;
    if (key === WILDCARD) {
      continue;
    }

    if (IGNORED_TYPES.has(question.getType())) {
      return undefined;
    }

    if (question.getType() === 'paneldynamic') {
      question = (question.getPanel() as PanelModel).getQuestionByValueName(
        key,
      );
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

function isSelectQuestion(question: Question): question is QuestionSelectBase {
  const selectTypes = [
    'dropdown',
    'checkbox',
    'radiogroup',
    'imagepicker',
    'ranking',
  ];
  return selectTypes.includes(question.getType());
}

function getQuestionOptions(
  question: Question,
): Record<string, string | Record<string, string>> | undefined {
  if (!isSelectQuestion(question)) {
    return undefined;
  }

  if (!question.choices || question.choices.length === 0) {
    return undefined;
  }

  // Normalize choices
  return question.choices.reduce((acc, choice) => {
    if (typeof choice === 'string') {
      acc[choice] = choice;
      return acc;
    }

    acc[choice.value] = choice.locText
      ? choice.locText.getJson()
      : (choice.text ?? choice.value);

    return acc;
  }, {});
}

export function getSelectOptions(
  form: object,
  field: string,
): Record<string, string | Record<string, string>> | undefined {
  const model = new SurveyModel(form);

  const parts = field.split(SEPARATOR);
  const firstField = parts.shift();
  if (firstField === undefined) {
    return undefined;
  }

  const question = getNestedQuestion(
    model.getQuestionByValueName(firstField),
    parts,
  );

  if (question == null) {
    return undefined;
  }

  return getQuestionOptions(question);
}
