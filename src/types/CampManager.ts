import { Identifiable } from 'src/types/Identifiable';

export interface CampManager extends Identifiable {
  name?: string;
  email: string;
  role: string;
  status: string;
}
