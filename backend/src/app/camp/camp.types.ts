import type { Camp, File } from '#generated/prisma/client';

interface FreePlaces {
  freePlaces: number | Record<string, number>;
}

interface CampFiles {
  files: Pick<File, 'id' | 'field' | 'locale'>[];
}

interface SimpleRegistrations {
  registrations: { country: string | null }[];
}

export type CampWithFreePlaces = Camp & FreePlaces;

export type CampWithFreePlacesAndFiles = CampWithFreePlaces & CampFiles;

export type CampWithRegistrationAndFiles = Camp &
  SimpleRegistrations &
  CampFiles;
