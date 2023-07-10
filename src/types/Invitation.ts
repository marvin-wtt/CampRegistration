import { Identifiable } from 'src/types/Identifiable';

export interface Invitation extends Identifiable {
  email: string;
}
