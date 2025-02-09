import {
  type PageModel,
  type PanelModel,
  type Question,
  SurveyModel,
} from 'survey-core';

interface SelectData {
  label: string;
  value: string;
}

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
    titleParts.push('*');
    nameParts.push('*');
  }

  return {
    label: removeMarkdownUrls(titleParts.join(' > ')),
    value: nameParts.join('.'),
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
  return survey
    .getAllQuestions(true, true, true)
    .flatMap((q) => collectSelectData(q, prefix));
}
