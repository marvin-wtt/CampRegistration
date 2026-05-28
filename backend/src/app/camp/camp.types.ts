import type { Camp } from '#generated/prisma/client';

export type CampWithFreePlaces = Camp & {
  freePlaces: number | Record<string, number>;
};
