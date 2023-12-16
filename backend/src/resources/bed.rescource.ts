import { Bed } from '@prisma/client';

const bedResource = (bed: Bed) => {
  const registrationId = bed.registrationId ?? null;

  return {
    id: bed.id,
    registrationId,
  };
};

export default bedResource;
