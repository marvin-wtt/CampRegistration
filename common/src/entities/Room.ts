import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';
import type { Bed } from './Bed.js';

export interface Room extends Identifiable {
  name: Translatable;
  sortOrder: number;
  beds: Bed[];
}

export type RoomCreateData = Pick<Room, 'name'> & {
  capacity: number;
};

export type RoomUpdateData = Partial<Pick<Room, 'name'>>;

export interface RoomBulkUpdateData {
  rooms: Pick<Room, 'id'> & Partial<Pick<Room, 'name' | 'sortOrder'>>[];
}
