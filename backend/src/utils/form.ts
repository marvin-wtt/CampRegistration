import { SurveyModel } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import { initSurveyJS } from './surveyJS';
import { Camp } from '@prisma/client';

initSurveyJS();

type CampWithFreePlaces = Camp & {
  freePlaces: number | Record<string, number>;
};

export const formUtils = (camp: Camp) => {
  const survey = new SurveyModel(camp.form);

  survey.locale = 'en-US';
  // TODO Camp with free places required here!
  setVariables(survey, camp as CampWithFreePlaces);

  const updateData = (data?: unknown) => {
    survey.data = typeof data !== 'object' ? {} : data;
  };

  const hasDataErrors = (): boolean => {
    return survey.hasErrors(false, false);
  };

  const getDataErrorFields = (): string => {
    return survey.pages
      .filter((value) => value.hasErrors(false, false))
      .flatMap((page) => page.questions)
      .filter((question) => question.hasErrors(false, false))
      .map((question) => question.name)
      .join(', ');
  };

  const getFileIds = (): string[] => {
    const extractId = (value: unknown): string | undefined => {
      if (typeof value !== 'string') {
        return undefined;
      }

      const trimmedUrl = value.replace(/\/+$/, '');
      return trimmedUrl.split('/').pop();
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
      .map((question) => question.value)
      .flatMap(extractIds)
      .filter((fileId): fileId is string => !!fileId);
  };

  const unknownDataFields = (): string[] => {
    const data = survey.data;

    return Object.keys(data).filter((valueName) => {
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
      .reduce(
        (campData, value) => {
          const type = value.campDataType;
          // Create a new entry for the camp data type if it does not exist
          if (!(type in campData)) {
            campData[type] = [];
          }
          campData[type].push(value.value);

          return campData;
        },
        {} as Record<string, unknown[]>,
      );
  };

  return {
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
