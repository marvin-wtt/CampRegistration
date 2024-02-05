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
    date: programEvent.date,
    time: programEvent.time,
    duration: programEvent.duration,
    color: programEvent.color,
    side: programEvent.side,
  };
};

export default programEventResource;
