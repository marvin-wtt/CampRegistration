import { ProgramEvent } from '@prisma/client';
import type { ProgramEvent as ProgramEventResource } from '@camp-registration/common/entities';

const programEventResource = (
  programEvent: ProgramEvent,
): ProgramEventResource => {
  return {
    id: programEvent.id,
    title: programEvent.title,
    details: programEvent.details,
    location: programEvent.location,
    date: programEvent.date ?? null,
    time: programEvent.time ?? null,
    duration: programEvent.duration ?? null,
    color: programEvent.color ?? 'white',
    side: (programEvent.side as ProgramEventResource['side']) ?? null,
  };
};

export default programEventResource;
