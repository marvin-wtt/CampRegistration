import { Serializer, SurveyModel } from "survey-core";
import { IQuestionPlainData } from "survey-core/typings/question";

type RequestFile = Express.Multer.File;
type FileType = RequestFile[] | Record<string, RequestFile[]>;
type FormFile = Pick<File, "name" | "type" | "size">;

export const formUtils = (formJson: unknown) => {
  const survey = new SurveyModel(formJson);

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

  const extractKeyFromFieldName = (fieldName: string): string => {
    const pattern = /^files\[(.+)]$/;
    const match = pattern.exec(fieldName);
    return match ? match[1] : fieldName;
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

  return {
    updateData,
    hasDataErrors,
    unknownDataFields,
  };
};

// TODO Is this needed? Otherwise remove
Serializer.addProperty("question", {
  name: "campData",
  type: "campDataMapping",
  default: undefined,
  isRequired: false,
  category: "general",
  visibleIndex: 3,
});

const showPlainData = (data: IQuestionPlainData[], name = "") => {
  // TODO This is needed to create the accessors
  data.forEach((value) => {
    const valueName = value["valueName"];

    const elementName = name + (valueName ? valueName : value.name);
    if (value.isNode && value.data) {
      showPlainData(value.data, elementName + ".");
    } else {
      console.log(elementName, value["campData"]);
    }
  });
};
