import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';
import type { Bed } from './Bed';

export interface Room extends Identifiable {
  name: Translatable;
  beds: Bed[];
}

export type RoomCreateData = Pick<Room, 'name'> & {
  capacity: number;
};

export type RoomUpdateData = Partial<RoomCreateData>;
