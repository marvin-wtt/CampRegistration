import { SurveyJSCampData } from './SurveyJSCampData';
import { Identifiable } from './Identifiable';
import { ITheme } from 'survey-core/typings/themes';
import { Translatable } from './Translatable';

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
  freePlaces: Translatable<number> | null;
}

export interface CampDetails extends Camp {
  form: SurveyJSCampData;
  themes: Record<string, ITheme>;
}

export type CampCreateData = Omit<CampDetails, 'id' | 'freePlaces'>;

export type CampUpdateData = Partial<CampCreateData>;
