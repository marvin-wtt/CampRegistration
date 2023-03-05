import { SimpleTranslation } from 'src/composables/objectTranslation';

export interface SurveyJSCampData {
  title: string | SimpleTranslation;
  description: string | SimpleTranslation;
  locale?: string;
  pages: {
    name: string;
    title?: string | SimpleTranslation;
    elements: {
      name: string;
      type: string;
      title: string | SimpleTranslation;
      description?: string | SimpleTranslation;
      isRequired?: boolean;
      choices?: {
        text: string | SimpleTranslation;
        value: unknown;
      }[];
    }[];
  }[];
}
