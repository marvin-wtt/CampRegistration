import { SurveyModel } from 'survey-core';
import { IQuestionPlainData } from 'survey-core/typings/question';

interface SelectData {
  label: string;
  value: string;
}
function showPlainData(
  data: IQuestionPlainData[],
  parentName = '',
): SelectData[] {
  return data.flatMap((value) => {
    if (value.questionType === 'expression') {
      return [];
    }

    const valueName = value['valueName'];
    const elementName = valueName ? valueName : value.name;
    const name = parentName + elementName;

    const elements: SelectData[] = [];
    // Add current element except arrays
    if (elementName !== 0) {
      elements.push({
        label: removeMarkdownUrls(value.title),
        value: elementName,
      });
    }

    // Add all children
    if (value.isNode && value.data) {
      elements.push(...showPlainData(value.data, name + '.'));
    }

    return elements;
  });
}

function removeMarkdownUrls(input: string): string {
  // Regular expression to match Markdown URLs
  const markdownUrlRegex = /\[([^\]]+)]\(([^)]+)\)/g;

  return input.replace(markdownUrlRegex, (match, linkText) => {
    return linkText;
  });
}

export function extractFormFields(form: object): SelectData[] {
  const survey = new SurveyModel(form);

  const data = survey.getPlainData({
    includeQuestionTypes: true,
    includeEmpty: true,
    includeValues: false,
    calculations: [
      {
        propertyName: 'valueName',
      },
    ],
  });

  return showPlainData(data);
}
