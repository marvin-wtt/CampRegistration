import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';
import type { Bed } from './Bed';

export interface Room extends Identifiable {
  name: Translatable;
  order: number;
  beds: Bed[];
}

export type RoomCreateData = Omit<Room, 'id' | 'beds'> & {
  capacity: number;
};

export type RoomUpdateData = Partial<Pick<Room, 'name' | 'order'>>;
