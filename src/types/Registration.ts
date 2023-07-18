import { Identifiable } from 'src/types/Identifiable';

export interface Registration extends Identifiable {
  room?: Record<string, string>;
  created_at: string;
  updated_at: string;

  [key: string]: unknown;
}
