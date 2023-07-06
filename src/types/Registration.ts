import { Identifiable } from 'src/types/Identifiable';
import { Room } from 'src/types/Room';

export interface Registration extends Identifiable {
  room?: Room;
  created_at: string;
  updated_at: string;

  [key: string]: unknown;
}
