import { Question, SurveyModel } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import { initSurveyJS } from './surveyJS';
import { Camp } from '@prisma/client';

initSurveyJS();

type CampWithFreePlaces = Camp & {
  freePlaces: number | Record<string, number>;
};

type TemporaryFileIdentifier = {
  id: string;
  field?: string;
};

export const formUtils = (camp: Camp) => {
  const survey = new SurveyModel(camp.form);

  survey.locale = 'en-US';
  // TODO Camp with free places required here!
  setVariables(survey, camp as CampWithFreePlaces);

  const updateData = (data?: unknown) => {
    survey.data = typeof data !== 'object' ? {} : data;
  };

  const data = () => {
    return survey.data;
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

  const getFileIdentifiers = (): TemporaryFileIdentifier[] => {
    const extractId = (value: unknown): TemporaryFileIdentifier | undefined => {
      if (typeof value !== 'string') {
        return undefined;
      }

      const parts = value.split('#');
      return {
        id: parts[0],
        field: parts.length === 2 ? parts[1] : undefined,
      };
    };

    const extractIds = (
      value: unknown,
    ): (TemporaryFileIdentifier | undefined)[] => {
      if (Array.isArray(value)) {
        return value.map(extractId);
      }

      return [extractId(value)];
    };

    return survey
      .getAllQuestions(false, undefined, true)
      .filter((question) => question.getType() === 'file')
      .filter((question) => question.value != null)
      .map((question) => question.value)
      .flatMap(extractIds)
      .filter((fileId): fileId is TemporaryFileIdentifier => !!fileId);
  };

  const mapFileValues = (fn: (value: unknown) => string): void => {
    survey
      .getAllQuestions(false, undefined, true)
      .filter((question) => question.getType() === 'file')
      .filter((question) => question.value != null)
      .forEach(
        (question) =>
          (question.value = Array.isArray(question.value)
            ? question.value.map(fn)
            : fn(question.value)),
      );
  };

  const hasFileValueErrors = (): boolean => {
    return invalidFileValues().length > 0;
  };

  const invalidFileValues = (): string[] => {
    const validateFileField = (value: unknown): boolean => {
      return typeof value === 'string';
    };

    const isFileQuestionInvalid = (question: Question): boolean => {
      const value = question.value;
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
    data,
    updateData,
    getFileIdentifiers,
    mapFileValues,
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
