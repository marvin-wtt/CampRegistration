import { Identifiable } from 'src/types/Identifiable';

export interface Registration extends Identifiable {
  // TODO Dont make it optional
  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}
