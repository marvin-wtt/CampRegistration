import {
  Serializer,
  SurveyModel,
} from "survey-core";
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

export const loadSurvey = (
  surveyJson: unknown,
  data?: unknown,
  files?: FileType
): SurveyModel => {
  const survey = new SurveyModel(surveyJson);

  const surveyData = !data || typeof data !== "object" ? {} : data;
  const surveyFiles = !files ? {} : mapFileFields(files);

  survey.data = { ...surveyData, ...surveyFiles };

  return survey;
};

export const hasSurveyErrors = (survey: SurveyModel): boolean => {
  return survey.pages.some((p) => p.hasErrors(false, false));
};

Serializer.addProperty("question", {
  name: "campData",
  type: "campDataMapping",
  default: undefined,
  isRequired: false,
  category: "general",
  visibleIndex: 3,
});

export const extractCampFormFields = (form: unknown) => {
  const survey = loadSurvey(form);

  const plainData = survey.getPlainData({
    includeEmpty: true,
    includeValues: false,
    includeQuestionTypes: false,
    calculations: [
      {
        propertyName: "valueName",
      },
      {
        propertyName: "campData",
      },
    ],
  });
  showPlainData(plainData);
};

const showPlainData = (data: IQuestionPlainData[], name = "") => {
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

  if (files instanceof File) {
    return {};
  }

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
