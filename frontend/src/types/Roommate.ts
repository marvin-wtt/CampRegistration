import { Identifiable } from '@camp-registration/common/entities';

export interface Roommate extends Identifiable {
  name: string;
  age?: number;
  gender?: string;
  country?: string;
  counselor?: boolean;
}
