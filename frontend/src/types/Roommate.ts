import { Identifiable } from 'src/types/Identifiable';

export interface Roommate extends Identifiable {
  name: string;
  age?: number;
  gender?: string;
  country?: string;
  counselor?: boolean;
}
