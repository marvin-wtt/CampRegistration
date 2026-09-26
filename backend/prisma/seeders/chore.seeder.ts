import type { Chore } from '#generated/prisma/client.js';
import prisma from '../client';
import { ChoreFactory, ChoreAssignmentFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';
import { EVENT_IDS } from './ids';
import { eventLocales, forLocales } from './locales';
import { seedDate } from './timeline';

interface ChoreData {
  name: string | Record<string, string>;
  defaultCount?: number;
  excludeStaff?: boolean;
  balanceCountries?: boolean;
}

interface ChoreAssignmentData {
  /** Index into the event's chore array this occurrence belongs to. */
  choreIndex: number;
  /** Days from the moment the seed ran — not from the event's start. */
  day: number;
  slot?: string | null;
  rotationUnit: 'PARTICIPANT' | 'ROOM';
  /** Accepted registrations to staff it with, taken in order; omit for an
   * unstaffed occurrence (the planner highlights those). */
  memberCount?: number;
  /** Room to staff it with, by index into the event's occupied rooms. */
  roomIndex?: number;
}

// Three months out — every occurrence lands inside the camp week, so this is
// the "all upcoming" case: nothing has happened yet.
const SUMMER_CHORES: ChoreData[] = [
  {
    name: { en: 'Kitchen Duty', fr: 'Service de cuisine' },
    defaultCount: 4,
    excludeStaff: true,
    balanceCountries: true,
  },
  { name: { en: 'Dishwashing', fr: 'Vaisselle' }, defaultCount: 2 },
  {
    name: { en: 'Trash & Recycling', fr: 'Poubelles et recyclage' },
    defaultCount: 2,
  },
];

const SUMMER_ASSIGNMENTS: ChoreAssignmentData[] = [
  {
    choreIndex: 0,
    day: 95,
    slot: 'Lunch',
    rotationUnit: 'ROOM',
    roomIndex: 0,
  },
  {
    choreIndex: 0,
    day: 96,
    slot: 'Dinner',
    rotationUnit: 'PARTICIPANT',
    memberCount: 4,
  },
  {
    choreIndex: 0,
    day: 97,
    slot: 'Breakfast',
    rotationUnit: 'ROOM',
    roomIndex: 1,
  },
  {
    choreIndex: 1,
    day: 95,
    slot: 'Dinner',
    rotationUnit: 'PARTICIPANT',
    memberCount: 2,
  },
  {
    choreIndex: 1,
    day: 96,
    slot: 'Lunch',
    rotationUnit: 'PARTICIPANT',
    memberCount: 2,
  },
  // Unstaffed — the roster highlights this one until someone picks it up.
  { choreIndex: 2, day: 96, slot: null, rotationUnit: 'PARTICIPANT' },
  {
    choreIndex: 2,
    day: 99,
    slot: null,
    rotationUnit: 'PARTICIPANT',
    memberCount: 2,
  },
];

// Started two days ago: gives the roster both a past occurrence (tucked
// behind the "past duties" toggle) and upcoming ones, in the same event.
const CITY_CHORES: ChoreData[] = [
  { name: 'Küchendienst', defaultCount: 3 },
  { name: 'Gemeinschaftsraum aufräumen', defaultCount: 2 },
];

const CITY_ASSIGNMENTS: ChoreAssignmentData[] = [
  {
    choreIndex: 0,
    day: -2,
    slot: 'Abendessen',
    rotationUnit: 'PARTICIPANT',
    memberCount: 3,
  },
  { choreIndex: 1, day: -1, slot: null, rotationUnit: 'PARTICIPANT' },
  {
    choreIndex: 0,
    day: 1,
    slot: 'Mittagessen',
    rotationUnit: 'PARTICIPANT',
    memberCount: 3,
  },
  { choreIndex: 1, day: 3, slot: null, rotationUnit: 'ROOM', roomIndex: 0 },
];

class ChoreSeeder extends BaseSeeder {
  name(): string {
    return 'chore';
  }

  async run(): Promise<void> {
    await this.seedEvent(EVENT_IDS.summer, SUMMER_CHORES, SUMMER_ASSIGNMENTS);
    await this.seedEvent(EVENT_IDS.city, CITY_CHORES, CITY_ASSIGNMENTS);
  }

  private async seedEvent(
    eventId: string,
    chores: ChoreData[],
    assignments: ChoreAssignmentData[],
  ): Promise<void> {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    const locales = eventLocales(event);

    const createdChores: Chore[] = [];
    for (const [index, chore] of chores.entries()) {
      createdChores.push(
        await ChoreFactory.create({
          event: { connect: { id: eventId } },
          name: forLocales(chore.name, locales),
          sortOrder: index,
          defaultCount: chore.defaultCount,
          excludeStaff: chore.excludeStaff,
          balanceCountries: chore.balanceCountries,
        }),
      );
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
    });
    const rooms = await prisma.room.findMany({
      where: { eventId },
      include: { beds: true },
      orderBy: { sortOrder: 'asc' },
    });
    const occupiedRooms = rooms.filter((room) =>
      room.beds.some((bed) => bed.registrationId !== null),
    );

    let participantCursor = 0;
    for (const assignment of assignments) {
      const chore = createdChores[assignment.choreIndex];
      if (!chore) {
        continue;
      }

      let registrationIds: string[] = [];
      if (assignment.roomIndex !== undefined) {
        const room = occupiedRooms[assignment.roomIndex];
        registrationIds =
          room?.beds
            .map((bed) => bed.registrationId)
            .filter((id): id is string => id !== null) ?? [];
      } else if (assignment.memberCount) {
        registrationIds = registrations
          .slice(participantCursor, participantCursor + assignment.memberCount)
          .map((registration) => registration.id);
        participantCursor += assignment.memberCount;
      }

      await ChoreAssignmentFactory.create({
        event: { connect: { id: eventId } },
        chore: { connect: { id: chore.id } },
        rotationUnit: assignment.rotationUnit,
        date: seedDate(assignment.day),
        slot: assignment.slot ?? null,
        members: {
          createMany: {
            data: registrationIds.map((registrationId) => ({
              registrationId,
            })),
          },
        },
      });
    }
  }
}

export default new ChoreSeeder();
