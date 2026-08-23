import { SurveyModel } from 'survey-core';
import type { Question } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import type { Camp } from '#generated/prisma/client.js';

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

const PATH_SEPARATOR = '.';
const LABEL_SEPARATOR = ' > ';

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

export const formUtils = (
  camp: Camp & { freePlaces: number | Record<string, number> },
  data?: unknown,
  options?: { locale?: string },
) => {
  const survey = new SurveyModel(camp.form);

  survey.locale = options?.locale ?? 'en-US';
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

  // Every answered field, flattened out of the survey's nesting and labelled in
  // the survey's locale. `getPlainData` is what resolves question titles and
  // choice labels, so callers get readable output without a lookup of their own.
  const answers = (): FormAnswer[] => {
    const plain = survey.getPlainData({
      includeEmpty: true,
      includeQuestionTypes: true,
    });

    return flattenAnswers(plain, []);
  };

  return {
    data: getData,
    updateData,
    getFileIds,
    hasDataErrors,
    getDataErrorFields,
    unknownDataFields,
    extractCampData,
    answers,
  };
};

export const extractKeyFromFieldName = (fieldName: string): string => {
  const pattern = /^files\[(.+)]$/;
  const match = pattern.exec(fieldName);
  return match ? match[1] : fieldName;
};
