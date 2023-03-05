import { Identifiable } from 'src/types/Identifiable';

export interface Registration extends Identifiable {
  [key: string]: unknown;
}
