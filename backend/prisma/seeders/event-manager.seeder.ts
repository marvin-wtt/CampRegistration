import { BaseSeeder } from './BaseSeeder';
import { EventManagerFactory, InvitationFactory } from '../factories';
import type { EventManagerRole } from '@camp-registration/common/permissions';
import { EVENT_IDS, USER_IDS } from './ids';
import { seedDate } from './timeline';

interface ManagerSeed {
  eventId: string;
  userId: string;
  role: EventManagerRole;
  /** Days from now; a past value means the record has lapsed. */
  expiresInDays?: number;
}

/**
 * John's role on every event he manages, one per role, plus one lapsed record.
 * Every event also gets a second manager so no manager list is a single row and
 * the last-director invariant never blocks a role change.
 *
 * Events deliberately absent: "Autumn Retreat" (reachable only through John's
 * organization ADMIN role) and "Seaside Event" (no relationship at all).
 */
const MANAGERS: ManagerSeed[] = [
  // Youth Adventures — John is also organization ADMIN here, so the event
  // permissions he sees are the union of his role and the organization set.
  { eventId: EVENT_IDS.summer, userId: USER_IDS.john, role: 'DIRECTOR' },
  { eventId: EVENT_IDS.summer, userId: USER_IDS.erika, role: 'COORDINATOR' },
  { eventId: EVENT_IDS.summer, userId: USER_IDS.peter, role: 'COUNSELOR' },
  { eventId: EVENT_IDS.summer, userId: USER_IDS.maria, role: 'VIEWER' },
  // A helper brought in for the event week only.
  {
    eventId: EVENT_IDS.summer,
    userId: USER_IDS.tom,
    role: 'COUNSELOR',
    expiresInDays: 21,
  },

  { eventId: EVENT_IDS.files, userId: USER_IDS.erika, role: 'DIRECTOR' },
  { eventId: EVENT_IDS.files, userId: USER_IDS.john, role: 'COORDINATOR' },

  { eventId: EVENT_IDS.autumn, userId: USER_IDS.maria, role: 'DIRECTOR' },

  { eventId: EVENT_IDS.spring, userId: USER_IDS.john, role: 'DIRECTOR' },
  { eventId: EVENT_IDS.spring, userId: USER_IDS.erika, role: 'COORDINATOR' },

  { eventId: EVENT_IDS.winter, userId: USER_IDS.john, role: 'DIRECTOR' },

  // Alpine Explorers — John is only an organization MEMBER, so these roles are
  // the whole of his access: one event per role, unmerged.
  {
    eventId: EVENT_IDS.mountainWeeks,
    userId: USER_IDS.erika,
    role: 'DIRECTOR',
  },
  {
    eventId: EVENT_IDS.mountainWeeks,
    userId: USER_IDS.john,
    role: 'COORDINATOR',
  },

  { eventId: EVENT_IDS.city, userId: USER_IDS.peter, role: 'DIRECTOR' },
  { eventId: EVENT_IDS.city, userId: USER_IDS.john, role: 'COUNSELOR' },

  { eventId: EVENT_IDS.simple, userId: USER_IDS.erika, role: 'DIRECTOR' },
  { eventId: EVENT_IDS.simple, userId: USER_IDS.john, role: 'VIEWER' },

  { eventId: EVENT_IDS.glacierTrek, userId: USER_IDS.erika, role: 'DIRECTOR' },
  // Lapsed: the record is still there, the access is not.
  {
    eventId: EVENT_IDS.glacierTrek,
    userId: USER_IDS.john,
    role: 'DIRECTOR',
    expiresInDays: -4,
  },

  // Events of the unverified organizations.
  { eventId: EVENT_IDS.printemps, userId: USER_IDS.john, role: 'DIRECTOR' },
  {
    eventId: EVENT_IDS.harbourSailing,
    userId: USER_IDS.john,
    role: 'DIRECTOR',
  },

  // Foreign organization: John must be refused everywhere here.
  { eventId: EVENT_IDS.seaside, userId: USER_IDS.tom, role: 'DIRECTOR' },
];

class EventManagerSeeder extends BaseSeeder {
  name(): string {
    return 'event-manager';
  }

  async run(): Promise<void> {
    for (const manager of MANAGERS) {
      await EventManagerFactory.create({
        event: { connect: { id: manager.eventId } },
        user: { connect: { id: manager.userId } },
        role: manager.role,
        expiresAt:
          manager.expiresInDays === undefined
            ? null
            : seedDate(manager.expiresInDays, '23:59'),
      });
    }

    // Invited by email, no account yet: shows up as PENDING in the list.
    const invitation = await InvitationFactory.create({
      email: 'newcomer@example.com',
    });

    await EventManagerFactory.create({
      event: { connect: { id: EVENT_IDS.summer } },
      invitation: { connect: { id: invitation.id } },
      role: 'COUNSELOR',
    });
  }
}

export default new EventManagerSeeder();
