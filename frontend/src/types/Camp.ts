import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { Identifiable } from 'src/types/Identifiable';
import { ITheme } from 'survey-core/typings/themes';
import { Translatable } from 'src/types/Translatable';

export interface Camp extends Identifiable {
  public: boolean;
  active: boolean;
  countries: string[];
  name: Translatable;
  organizer: Translatable;
  contactEmail: Translatable;
  maxParticipants: Translatable<number>;
  startAt: string;
  endAt: string;
  minAge: number;
  maxAge: number;
  location: Translatable;
  price: number;
  form: SurveyJSCampData;
  themes: Record<string, ITheme>;
}

export type CampCreateData = Omit<Camp, 'id'>;

export type CampUpdateData = Partial<CampCreateData>;
