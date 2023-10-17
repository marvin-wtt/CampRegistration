import { Base, JsonObjectProperty } from 'survey-core';
import { ISurveyCreatorOptions } from 'survey-creator-knockout';

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
