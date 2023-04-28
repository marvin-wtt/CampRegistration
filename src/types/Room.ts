import { Identifiable } from 'src/types/Identifiable';
import { Roommate } from 'src/types/Roommate';

export interface Room extends Identifiable {
  name: string | Record<string, string>;
  capacity: number;
  roommates: (Roommate | null)[];
}
