export interface SurveyJSCampData {
  title: string | Record<string, string>;
  description: string | Record<string, string>;
  locale?: string;
  pages: {
    name: string;
    title?: string | Record<string, string>;
    elements: {
      name: string;
      type: string;
      title: string | Record<string, string>;
      description?: string | Record<string, string>;
      isRequired?: boolean;
      choices?: {
        text: string | Record<string, string>;
        value: unknown;
      }[];
    }[];
  }[];
}
