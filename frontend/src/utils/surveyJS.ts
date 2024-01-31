import { Question, SurveyModel } from 'survey-core';

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

export function extractFormFields(form: object, prefix?: string): SelectData[] {
  const survey = new SurveyModel(form);

  const mapQuestions = (
    parent?: string,
    parentTitle?: string,
  ): ((question: Question) => SelectData[]) => {
    return (question: Question): SelectData[] => {
      const title = question.title ?? '';
      const fullTitle = parentTitle ? `${parentTitle} > ${title}` : title;
      const name = question.getValueName();
      const fullName = parent ? `${parent}.${name}` : name;
      const children = question.getNestedQuestions();

      if (question.getType() === 'expression') {
        return [];
      }

      const elements = [
        {
          label: removeMarkdownUrls(fullTitle),
          value: fullName,
        },
      ];

      if (children.length > 0) {
        elements.push(...children.flatMap(mapQuestions(fullName, fullTitle)));
      }

      return elements;
    };
  };

  return survey.getAllQuestions().flatMap(mapQuestions(prefix));
}
