import type {
  Identifiable,
  Room,
  Bed,
} from '@camp-registration/common/entities';

export interface Roommate extends Identifiable {
  name: string;
  age?: number | undefined;
  gender?: string | undefined;
  country?: string | undefined;
  participant?: boolean | undefined;
}

interface BedWithRoommate extends Omit<Bed, 'registrationId'> {
  person: Roommate | null;
}

export interface RoomWithRoommates extends Omit<Room, 'beds'> {
  beds: BedWithRoommate[];
}
