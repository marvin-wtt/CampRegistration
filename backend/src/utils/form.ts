import { type ITheme, SurveyModel } from 'survey-core';
import { SurveyPDF } from 'survey-pdf';
import type { Question } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import type { Registration } from '#generated/prisma/client.js';
import jsdom from 'jsdom';
import type { CampWithFreePlacesAndFiles } from '#app/camp/camp.types';
import { createMarkdownConverter } from '@camp-registration/common/utils';
import { generateApiUrl } from '#utils/url';
import { Mutex } from 'async-mutex';

import 'survey-core/i18n';

// Serializes PDF generation since survey-pdf relies on shared global state
// (global.window / global.document) that concurrent calls would clobber.
const pdfMutex = new Mutex();

export function exportPDF(
  camp: CampWithFreePlacesAndFiles,
  registration: Registration,
): Promise<ArrayBuffer> {
  return pdfMutex.runExclusive(() => runExportPDF(camp, registration));
}

async function runExportPDF(
  camp: CampWithFreePlacesAndFiles,
  registration: Registration,
): Promise<ArrayBuffer> {
  const { window } = new jsdom.JSDOM();

  const prevWindow = global.window;
  const prevDocument = global.document;

  // @ts-expect-error Required for survey-pdf, which expects a browser environment
  global.window = window;
  global.document = window.document;

  try {
    const surveyPDF = new SurveyPDF(camp.form);
    surveyPDF.data = registration.data;
    surveyPDF.locale = registration.locale;
    surveyPDF.applyTheme(camp.themes.light as ITheme);
    surveyPDF.readOnly = true;

    const mdConverter = createMarkdownConverter();
    surveyPDF.onTextMarkdown.add((_, options) => {
      options.html = mdConverter.renderInline(options.text);
    });

    setVariables(
      surveyPDF,
      camp,
      (id: string) => generateApiUrl(['files', id]),
      camp.files,
    );

    return await surveyPDF.raw('arraybuffer');
  } finally {
    global.window = prevWindow;
    global.document = prevDocument;
  }
}

export const formUtils = (camp: CampWithFreePlacesAndFiles, data?: unknown) => {
  const survey = new SurveyModel(camp.form);

  survey.locale = 'en-US';
  setVariables(survey, camp);
  survey.data = typeof data !== 'object' ? {} : data;

  const updateData = (data?: unknown) => {
    survey.data = typeof data !== 'object' ? {} : data;
  };

  const getData = () => {
    return survey.data as Record<string, unknown>;
  };

  const hasDataErrors = (): boolean => {
    return survey.hasErrors(false, false) || hasFileValueErrors();
  };

  const getDataErrorFields = (): string => {
    const formErrors = survey.pages
      .filter((value) => value.hasErrors(false, false))
      .flatMap((page) => page.questions)
      .filter((question) => question.hasErrors(false, false))
      .map((question) => question.name);

    const fileValueErrors = invalidFileValues();

    return [...formErrors, ...fileValueErrors].join(', ');
  };

  const getFileIds = (): string[] => {
    const extractId = (value: unknown): string | undefined => {
      return typeof value === 'string' ? value : undefined;
    };

    const extractIds = (value: unknown): (string | undefined)[] => {
      if (Array.isArray(value)) {
        return value.map(extractId);
      }

      return [extractId(value)];
    };

    return survey
      .getAllQuestions(false, undefined, true)
      .filter((question) => question.getType() === 'file')
      .filter((question) => question.value != null)
      .map((question) => question.value as unknown)
      .flatMap(extractIds)
      .filter((fileId): fileId is string => !!fileId);
  };

  const hasFileValueErrors = (): boolean => {
    return invalidFileValues().length > 0;
  };

  const invalidFileValues = (): string[] => {
    const validateFileField = (value: unknown): boolean => {
      return typeof value === 'string';
    };

    const isFileQuestionInvalid = (question: Question): boolean => {
      const value: unknown = question.value;
      if (value == null) {
        return false;
      }

      const valid = Array.isArray(value)
        ? value.every(validateFileField)
        : validateFileField(value);

      return !valid;
    };

    return survey
      .getAllQuestions(false, undefined, true)
      .filter((question) => question.getType() === 'file')
      .filter(isFileQuestionInvalid)
      .map((question) => question.name);
  };

  const unknownDataFields = (): string[] => {
    const data = survey.data as Record<string, unknown>;

    return Object.keys(data).filter((valueName) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return survey.getQuestionByValueName(valueName) === null;
    });
  };

  const extractCampData = (): Record<string, unknown[]> => {
    const data = survey.getPlainData({
      includeEmpty: true,
      includeQuestionTypes: true,
      includeValues: true,
      calculations: [{ propertyName: 'campDataType' }],
    });

    return data
      .filter((value) => value.campDataType)
      .map((value) => {
        // Undefined is not accepted by prisma and must be replaced with null
        value.value ??= null;
        return value;
      })
      .reduce<Record<string, unknown[]>>((tagData, value) => {
        const tag: unknown = value.campDataType;

        if (typeof tag !== 'string') {
          return tagData;
        }

        // Create a new entry for the camp data type if it does not exist
        if (!(tag in tagData)) {
          tagData[tag] = [];
        }
        tagData[tag].push(value.value);

        return tagData;
      }, {});
  };

  return {
    data: getData,
    updateData,
    getFileIds,
    hasDataErrors,
    getDataErrorFields,
    unknownDataFields,
    extractCampData,
  };
};

export const extractKeyFromFieldName = (fieldName: string): string => {
  const pattern = /^files\[(.+)]$/;
  const match = pattern.exec(fieldName);
  return match ? match[1] : fieldName;
};
