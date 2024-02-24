import { Registration, Room, Bed } from '@prisma/client';
import type { Registration as RegistrationResource } from '@camp-registration/common/entities';

interface RegistrationWithBed extends Registration {
  bed?: BedWithRoom | null;
}

interface BedWithRoom extends Bed {
  room: Room;
}

const registrationResource = (
  registration: RegistrationWithBed,
): RegistrationResource => {
  const room = registration.bed ? registration.bed.room.name : null;

  return {
    id: registration.id,
    waitingList: registration.waitingList,
    data: registration.data,
    campData: registration.campData,
    locale: registration.locale,
    room,
    // Use snake case because form keys should be snake case too
    updatedAt: registration.updatedAt?.toISOString() ?? null,
    createdAt: registration.createdAt.toISOString(),
  };
};

export default registrationResource;
