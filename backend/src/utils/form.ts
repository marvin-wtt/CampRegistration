import { SurveyModel } from "survey-core";
import { IQuestionPlainData } from "survey-core/typings/question";
import "./formRegistration"; // TODO Why can't I just import the common package here???

type RequestFile = Express.Multer.File;
type FileType = RequestFile[] | Record<string, RequestFile[]>;
type FormFile = Pick<File, "name" | "type" | "size">;

export const formUtils = (formJson: unknown) => {
  const survey = new SurveyModel(formJson);
  const fileQuestions = survey
    .getAllQuestions(false, undefined, true)
    .filter((question) => question.getType() === "file");

  let fileMap: Map<string, FormFile> = new Map<string, FormFile>();

  // TODO Set camp variables for

  const updateData = (data?: unknown, files?: FileType) => {
    survey.data = typeof data !== "object" ? {} : data;

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
    return survey.pages.some((p) => p.hasErrors(false, false));
  };

  const unknownDataFields = (): string[] => {
    const data = survey.data;

    return Object.keys(data).filter((valueName) => {
      return survey.getQuestionByValueName(valueName) === null;
    });
  };

  const extractAccessors = () => {
    const data = survey.getPlainData({
      includeEmpty: true,
      includeQuestionTypes: true,
      includeValues: false,
      calculations: [
        { propertyName: "valueName" },
        { propertyName: "campDataType" },
      ],
    });

    // TODO Panels are not actually listed here
    //  Maybe just iterate all questions instead?
    //  Questions have access to the panels

    return getCampDataPaths(data);
  };

  return {
    updateData,
    hasDataErrors,
    hasUnknownFiles,
    unknownDataFields,
    extractAccessors,
  };
};

export const extractKeyFromFieldName = (fieldName: string): string => {
  const pattern = /^files\[(.+)]$/;
  const match = pattern.exec(fieldName);
  return match ? match[1] : fieldName;
};

type FieldAccessor = Record<string, (string | number)[][]>;

const getCampDataPaths = (
  data: IQuestionPlainData[],
  parentPath: string[] = [],
  accessors: FieldAccessor = {},
): FieldAccessor => {
  data.forEach((question) => {
    const valueName = question["valueName"];
    const elementName = valueName ? valueName : question.name;
    const path = [...parentPath, elementName];

    if ("campDataType" in question && question.campDataType) {
      accessors[question.campDataType] ??= [];
      accessors[question.campDataType].push(path);
    }

    if (question.isNode && question.data) {
      getCampDataPaths(question.data, path);
    }
  });

  return accessors;
};
