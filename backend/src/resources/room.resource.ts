import { Bed, Room } from '@prisma/client';
import type { Room as RoomResource } from '@camp-registration/common/entities';
import { bedResource } from './index';

interface RoomWithBeds extends Room {
  beds: Bed[];
}

const roomResource = (room: RoomWithBeds): RoomResource => {
  return {
    id: room.id,
    name: room.name,
    beds: room.beds.map((value) => bedResource(value)),
  };
};

export default roomResource;
