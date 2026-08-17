import type { Camp, Registration } from '#generated/prisma/client.js';
import prisma from '../client';
import { RoomFactory } from '../factories';
import { campLocales, forLocales } from './locales';
import { ulid } from '#utils/ulid';

interface RoomData {
  name: string | Record<string, string>;
  beds: number;
  /** Share of the room's beds to fill, so the planner shows a mixed house. */
  occupancy: number;
  /** Who the room is filled with — the room planner filters candidates alike. */
  occupants: 'f' | 'm' | 'counselor';
}

const ROOMS: RoomData[] = [
  {
    name: { en: 'Fox Cabin', fr: 'Chalet Renard', de: 'Fuchshütte' },
    beds: 8,
    occupancy: 1,
    occupants: 'f',
  },
  {
    name: { en: 'Owl Cabin', fr: 'Chalet Hibou', de: 'Eulenhütte' },
    beds: 8,
    occupancy: 0.75,
    occupants: 'm',
  },
  {
    name: { en: 'Deer Cabin', fr: 'Chalet Cerf', de: 'Hirschhütte' },
    beds: 6,
    occupancy: 0.5,
    occupants: 'f',
  },
  { name: 'Attic Left', beds: 4, occupancy: 0.5, occupants: 'm' },
  { name: 'Attic Right', beds: 4, occupancy: 0.25, occupants: 'f' },
  { name: 'Staff Quarters', beds: 6, occupancy: 0.5, occupants: 'counselor' },
  { name: 'Spare Room', beds: 4, occupancy: 0, occupants: 'm' },
];

/**
 * Round-robins the countries against each other, so an international camp gets
 * rooms whose occupants come from both of them instead of the rooms filling up
 * country by country in the order the registrations were seeded.
 */
function mixCountries(registrations: Registration[]): Registration[] {
  const queues = new Map<string | null, Registration[]>();
  for (const registration of registrations) {
    const queue = queues.get(registration.country);
    if (queue) {
      queue.push(registration);
    } else {
      queues.set(registration.country, [registration]);
    }
  }

  const mixed: Registration[] = [];
  while (mixed.length < registrations.length) {
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (next) {
        mixed.push(next);
      }
    }
  }

  return mixed;
}

/**
 * Rooms with beds in every state the room planner can show: a full room, partly
 * filled ones, an empty one, and rooms that are consistent in gender and role
 * so the planner's filters have something to work with. Every partly filled
 * room is occupied from the top down, leaving its free beds at the bottom.
 */
export class RoomSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    const registrations = await prisma.registration.findMany({
      where: { campId: this.camp.id, status: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
    });
    const locales = campLocales(this.camp);

    const queues: Record<RoomData['occupants'], Registration[]> = {
      f: mixCountries(
        registrations.filter(
          (it) => it.role === 'participant' && it.gender === 'f',
        ),
      ),
      m: mixCountries(
        registrations.filter(
          (it) => it.role === 'participant' && it.gender === 'm',
        ),
      ),
      counselor: mixCountries(
        registrations.filter((it) => it.role !== 'participant'),
      ),
    };

    for (const [index, room] of ROOMS.entries()) {
      const queue = queues[room.occupants];
      const occupied = Math.round(room.beds * room.occupancy);

      const beds = Array.from({ length: room.beds }, (_, bed) => {
        // `shift` runs the queue dry silently on a camp with few participants.
        const registration = bed < occupied ? queue.shift() : undefined;

        // Beds are read back in primary key order, so the ids have to be
        // handed out in bed order for the planner to show the occupied ones
        // at the top — the generated default is not monotonic.
        return {
          id: ulid(),
          ...(registration
            ? { registration: { connect: { id: registration.id } } }
            : {}),
        };
      });

      await RoomFactory.create({
        camp: { connect: { id: this.camp.id } },
        name: forLocales(room.name, locales),
        sortOrder: index,
        beds: { create: beds },
      });
    }
  }
}
