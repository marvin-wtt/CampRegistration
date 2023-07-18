import {Bed, Room} from "@prisma/client";
import { bedResource } from "./index";

interface RoomWithBeds extends Room {
  beds: Bed[];
}

const roomResource = (room: RoomWithBeds) => {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    beds: room.beds.map((value) => bedResource(value)),
  };
};

export default roomResource;
