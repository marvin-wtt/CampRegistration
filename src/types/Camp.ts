import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { Identifiable } from 'src/types/Identifiable';

export interface Camp extends Identifiable {
  public: boolean;
  active: boolean;
  countries: string[];
  name: string | Record<string, string>;
  organization: string | Record<string, string>;
  maxParticipants: number | Record<string, number>;
  startAt: string;
  endAt: string;
  minAge: number;
  maxAge: number;
  location: string | Record<string, string>;
  price: string;
  form: SurveyJSCampData;
}
