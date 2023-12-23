import type {
  Identifiable,
  Translatable,
} from '@camp-registration/common/entities';
import { Roommate } from 'src/types/Roommate';

interface Bed extends Identifiable {
  person: Roommate | null;
}

export interface Room extends Identifiable {
  name: Translatable;
  capacity: number;
  beds: Bed[];
}

interface ResponseBed extends Identifiable {
  registrationId: string | null;
}

export interface ResponseRoom extends Identifiable {
  name: Translatable;
  capacity: number;
  beds: ResponseBed[];
}

export type RoomCreateData = Pick<Room, 'name' | 'capacity'>;

export type RoomUpdateData = Partial<RoomCreateData>;
