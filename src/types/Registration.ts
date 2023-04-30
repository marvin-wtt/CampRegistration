import { Identifiable } from 'src/types/Identifiable';

export interface Registration extends Identifiable {
  room_name?: string | Record<string, string>;
  room_id?: string | null;
  created_at: string;
  updated_at: string;

  [key: string]: unknown;
}
