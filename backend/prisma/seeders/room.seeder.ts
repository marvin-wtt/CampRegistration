import type { Camp, Registration } from '#generated/prisma/client.js';
import prisma from '../client';
import { RoomFactory } from '../factories';

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
 * Rooms with beds in every state the room planner can show: a full room, partly
 * filled ones, an empty one, and rooms that are consistent in gender and role
 * so the planner's filters have something to work with.
 */
export class RoomSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    const registrations = await prisma.registration.findMany({
      where: { campId: this.camp.id, status: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
    });

    const queues: Record<RoomData['occupants'], Registration[]> = {
      f: registrations.filter(
        (it) => it.role === 'participant' && it.gender === 'f',
      ),
      m: registrations.filter(
        (it) => it.role === 'participant' && it.gender === 'm',
      ),
      counselor: registrations.filter((it) => it.role !== 'participant'),
    };

    for (const [index, room] of ROOMS.entries()) {
      const queue = queues[room.occupants];
      const occupied = Math.round(room.beds * room.occupancy);

      const beds = Array.from({ length: room.beds }, (_, bed) => {
        // `shift` runs the queue dry silently on a camp with few participants.
        const registration = bed < occupied ? queue.shift() : undefined;

        return registration
          ? { registration: { connect: { id: registration.id } } }
          : {};
      });

      await RoomFactory.create({
        camp: { connect: { id: this.camp.id } },
        name: room.name,
        sortOrder: index,
        beds: { create: beds },
      });
    }
  }
}
