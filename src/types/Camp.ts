import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { Identifiable } from 'src/types/Identifiable';

export interface Camp extends Identifiable {
  public?: boolean;
  countries: string[];
  name: string | Record<string, string>;
  maxParticipants: number | Record<string, number>;
  startDate: string;
  endDate: string;
  minAge: number;
  maxAge: number;
  location: string | Record<string, string>;
  price: string;
  form: SurveyJSCampData;
}
