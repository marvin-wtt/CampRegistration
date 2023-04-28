import { Identifiable } from 'src/types/Identifiable';

export interface RoomMate extends Identifiable {
  name: string;
  age?: number;
  gender?: string;
  country?: string;
  leader?: boolean;
}
