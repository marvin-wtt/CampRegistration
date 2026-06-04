import type { Camp, File } from '#generated/prisma/client';

export interface CampWithFreePlacesAndFiles extends Camp {
  freePlaces: number | Record<string, number>;
  files: Pick<File, 'id' | 'field' | 'locale'>[];
}

export interface CampWithRegistrationAndFiles extends Camp {
  registrations: { country: string | null }[];
  files: Pick<File, 'id' | 'field' | 'locale'>[];
}
