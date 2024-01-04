import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';
import type { Bed } from './Bed';

export interface Room extends Identifiable {
  name: Translatable;
  capacity: number;
  beds: Bed[];
}

export type RoomCreateData = Pick<Room, 'name' | 'capacity'>;

export type RoomUpdateData = Partial<RoomCreateData>;
