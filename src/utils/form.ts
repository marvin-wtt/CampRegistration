import { Serializer, SurveyModel } from "survey-core";
import { IQuestionPlainData } from "survey-core/typings/question";

type File = Express.Multer.File;
type FileType = File[] | Record<string, File[]>;
type FileOptions = Record<
  string,
  {
    type: string;
    name: string;
  }[]
>;

export const formUtils = (formJson: unknown) => {
  const survey = new SurveyModel(formJson);

  const updateData = (data?: unknown, files?: FileType) => {
    const surveyData = typeof data !== "object" ? {} : data;
    const surveyFiles = !files ? {} : mapFileFields(files);

    survey.data = { ...surveyData, ...surveyFiles };
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

export const hasUnknownFields = (survey: SurveyModel): boolean => {
  const data = survey.getPlainData({
    includeEmpty: false,
    includeValues: true,
    calculations: [
      {
        propertyName: "valueName",
      },
    ],
  });

  console.log(data);

  return false;
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
  // TODO
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

const mapFileFields = (files: FileType): FileOptions => {
  const mapFileToSurveyData = (file: File) => {
    return {
      type: file.mimetype,
      name: file.originalname,
    };
  };

  // Array should already be formatted
  if (!files || Array.isArray(files) || typeof files !== "object") {
    return {};
  }

  const requestFiles = files;
  return Object.keys(requestFiles).reduce((acc, key) => {
    const files = requestFiles[key];
    acc[key] = files.map((file) => mapFileToSurveyData(file));
    return acc;
  }, {} as FileOptions);
};
