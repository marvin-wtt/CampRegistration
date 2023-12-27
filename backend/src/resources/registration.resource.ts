import { Registration, Room, Bed, File } from '@prisma/client';
import type { Registration as RegistrationResource } from '@camp-registration/common/entities';
import config from 'config';
import groupBy from 'utils/groupBy';

interface RegistrationWithBedAndFiles extends Registration {
  bed?: BedWithRoom | null;
  files?: File[] | null;
}

interface BedWithRoom extends Bed {
  room: Room;
}

const extractFiles = (
  registration: RegistrationWithBedAndFiles,
): Record<string, string> => {
  if (!registration.files) {
    return {};
  }

  const fileUrl = `${config.origin}/registrations/${registration.id}/files/`;
  return Object.fromEntries(
    Object.entries(groupBy(registration.files, (i) => i.field ?? 'files')).map(
      ([field, files]) => [
        field,
        files.map((file) => fileUrl + file.id).join(';'),
      ],
    ),
  );
};

const registrationResource = (
  registration: RegistrationWithBedAndFiles,
): RegistrationResource => {
  const room = registration.bed ? registration.bed.room.name : null;
  const files = extractFiles(registration);

  return {
    id: registration.id,
    waitingList: registration.waitingList,
    data: registration.data,
    campData: registration.campData,
    locale: registration.locale,
    room,
    files,
    // Use snake case because form keys should be snake case too
    updated_at: registration.updatedAt?.toISOString() ?? null,
    created_at: registration.createdAt.toISOString(),
  };
};

export default registrationResource;
