import { type Base, type JsonObjectProperty } from 'survey-core';
import { type ISurveyCreatorOptions } from 'survey-creator-core';

export interface CampDataType {
  fit: (
    obj: Base,
    prop: JsonObjectProperty,
    options: ISurveyCreatorOptions,
  ) => boolean;
  element: {
    text: string | Record<string, string>;
    value: string;
  };
}
