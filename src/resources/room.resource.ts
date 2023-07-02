import { Room } from "@prisma/client";

const roomResource = (room: Room) => {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
  };
};

export default roomResource;
