import type { Camp } from '#generated/prisma/client';

interface FreePlaces {
  freePlaces: number | Record<string, number>;
}

export type CampWithFreePlaces = Camp & FreePlaces;
