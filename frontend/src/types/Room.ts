import type {
  Identifiable,
  Room,
  Bed,
} from '@camp-registration/common/entities';

export interface Roommate extends Identifiable {
  name: string;
  age?: number;
  gender?: string;
  country?: string;
  participant?: boolean;
}

interface BedWithRoommate extends Omit<Bed, 'registrationId'> {
  person: Roommate | null;
}

export interface RoomWithRoommates extends Omit<Room, 'beds'> {
  beds: BedWithRoommate[];
}
