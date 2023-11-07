import {
  ComponentCollection,
  FunctionFactory,
  Serializer,
  SurveyModel,
} from "survey-core";
import { IQuestionPlainData } from "survey-core/typings/question";
import {
  Components,
  Functions,
  Properties,
} from "@camp-registration/common/form";

type RequestFile = Express.Multer.File;
type FileType = RequestFile[] | Record<string, RequestFile[]>;
type FormFile = Pick<File, "name" | "type" | "size">;

for (const component of Components) {
  ComponentCollection.Instance.add(component);
}

for (const fn of Functions) {
  FunctionFactory.Instance.register(fn.name, fn.func, fn.isAsync);
}

for (const property of Properties) {
  Serializer.addProperty(property.classname, property.propertyInfo);
}

export const formUtils = (formJson: unknown) => {
  const survey = new SurveyModel(formJson);

  // TODO Set camp variables for

  const updateData = (data?: unknown, files?: FileType) => {
    survey.data = typeof data !== "object" ? {} : data;

    if (files) {
      mapFileQuestions(files);
    }
  };

  const mapFileQuestions = (files: FileType) => {
    const fileMap = createFileMap(files);
    const questions = survey.getAllQuestions(false, undefined, true);
    questions.forEach((question) => {
      if (question.getType() !== "file") {
        return;
      }

      if (Array.isArray(question.value)) {
        question.value = question.value.map((value) => {
          return {
            file: fileMap.get(value),
          };
        });
      } else {
        question.value = {
          file: fileMap.get(question.value),
        };
      }
    });
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
        { propertyName: "campData" },
      ],
    });

    return getCampDataPaths(data);
  };

  return {
    updateData,
    hasDataErrors,
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

    if ("campData" in question && question.campData) {
      accessors[question.campData] ??= [];
      accessors[question.campData].push(path);
    }

    if (question.isNode && question.data) {
      getCampDataPaths(question.data, path);
    }
  });

  return accessors;
};
