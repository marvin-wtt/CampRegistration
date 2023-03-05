import { SimpleTranslation } from 'src/composables/objectTranslation';
import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { Identifiable } from 'src/types/Identifiable';

export interface Camp extends Identifiable {
  public?: boolean;
  name: string | SimpleTranslation;
  startDate: string;
  endDate: string;
  minAge: number;
  maxAge: number;
  location: string | SimpleTranslation;
  price: string;
  form: object | SurveyJSCampData;
}
