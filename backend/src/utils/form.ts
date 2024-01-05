import { SurveyModel } from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import { initSurveyJS } from './surveyJS';
import { Camp } from '@prisma/client';

type RequestFile = Express.Multer.File;
type FileType = RequestFile[] | Record<string, RequestFile[]>;
type FormFile = Pick<File, 'name' | 'type' | 'size'>;

initSurveyJS();

type CampWithFreePlaces = Camp & {
  freePlaces: number | Record<string, number>;
};

export const formUtils = (camp: Camp) => {
  const survey = new SurveyModel(camp.form);
  const fileQuestions = survey
    .getAllQuestions(false, undefined, true)
    .filter((question) => question.getType() === 'file');

  let fileMap: Map<string, FormFile> = new Map<string, FormFile>();

  // TODO Camp with free places required here!
  setVariables(survey, camp as CampWithFreePlaces);

  const updateData = (data?: unknown, files?: FileType) => {
    survey.data = typeof data !== 'object' ? {} : data;

    if (files) {
      fileMap = createFileMap(files);
      mapFileQuestions();
    }
  };

  const mapFileQuestions = () => {
    const mapValueToFile = (value: string) => ({ file: fileMap.get(value) });

    fileQuestions.forEach((question) => {
      question.value = Array.isArray(question.value)
        ? (question.value = question.value.map(mapValueToFile))
        : (question.value = mapValueToFile(question.value));
    });
  };

  const hasUnknownFiles = (): boolean => {
    const count = fileQuestions.reduce((count, question) => {
      if (Array.isArray(question.value)) {
        return count + question.value.length;
      }
      if (question.value?.file) {
        return count + 1;
      }
      return count;
    }, 0);

    return count != fileMap.size;
  };

  const createFileMap = (files: FileType) => {
    const fileArray = Array.isArray(files)
      ? files
      : Object.values(files).flat();

    const fileMap = new Map<string, FormFile>();
    fileArray.forEach((file) => {
      const { originalname, size, mimetype, fieldname } = file;
      const key = extractKeyFromFieldName(fieldname);
      fileMap.set(key, { name: originalname, size, type: mimetype });
    });

    return fileMap;
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
    hasDataErrors,
    getDataErrorFields,
    hasUnknownFiles,
    unknownDataFields,
    extractCampData,
  };
};

export const extractKeyFromFieldName = (fieldName: string): string => {
  const pattern = /^files\[(.+)]$/;
  const match = pattern.exec(fieldName);
  return match ? match[1] : fieldName;
};
