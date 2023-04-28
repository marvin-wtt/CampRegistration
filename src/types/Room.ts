import { Identifiable } from 'src/types/Identifiable';
import { RoomMate } from 'src/types/RoomMate';

export interface Room extends Identifiable {
  name: string | Record<string, string>;
  capacity: number;
  roomMates: (RoomMate | null)[];
}
