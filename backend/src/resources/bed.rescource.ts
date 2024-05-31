import { Bed } from '@prisma/client';
import type { Bed as BedResource } from '@camp-registration/common/entities';

const bedResource = (bed: Bed): BedResource => {
  const registrationId = bed.registrationId ?? null;

  return {
    id: bed.id,
    registrationId,
  };
};

export default bedResource;
