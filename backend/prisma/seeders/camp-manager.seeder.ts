import { BaseSeeder } from './BaseSeeder';
import { CampManagerFactory, InvitationFactory } from '../factories';
import type { CampManagerRole } from '@camp-registration/common/permissions';
import { CAMP_IDS, USER_IDS } from './ids';
import { seedDate } from './timeline';

interface ManagerSeed {
  campId: string;
  userId: string;
  role: CampManagerRole;
  /** Days from now; a past value means the record has lapsed. */
  expiresInDays?: number;
}

/**
 * John's role on every camp he manages, one per role, plus one lapsed record.
 * Every camp also gets a second manager so no manager list is a single row and
 * the last-director invariant never blocks a role change.
 *
 * Camps deliberately absent: "Autumn Retreat" (reachable only through John's
 * organization ADMIN role) and "Seaside Camp" (no relationship at all).
 */
const MANAGERS: ManagerSeed[] = [
  // Youth Adventures — John is also organization ADMIN here, so the camp
  // permissions he sees are the union of his role and the organization set.
  { campId: CAMP_IDS.summer, userId: USER_IDS.john, role: 'DIRECTOR' },
  { campId: CAMP_IDS.summer, userId: USER_IDS.erika, role: 'COORDINATOR' },
  { campId: CAMP_IDS.summer, userId: USER_IDS.peter, role: 'COUNSELOR' },
  { campId: CAMP_IDS.summer, userId: USER_IDS.maria, role: 'VIEWER' },
  // A helper brought in for the camp week only.
  {
    campId: CAMP_IDS.summer,
    userId: USER_IDS.tom,
    role: 'COUNSELOR',
    expiresInDays: 21,
  },

  { campId: CAMP_IDS.files, userId: USER_IDS.erika, role: 'DIRECTOR' },
  { campId: CAMP_IDS.files, userId: USER_IDS.john, role: 'COORDINATOR' },

  { campId: CAMP_IDS.autumn, userId: USER_IDS.maria, role: 'DIRECTOR' },

  { campId: CAMP_IDS.spring, userId: USER_IDS.john, role: 'DIRECTOR' },
  { campId: CAMP_IDS.spring, userId: USER_IDS.erika, role: 'COORDINATOR' },

  { campId: CAMP_IDS.winter, userId: USER_IDS.john, role: 'DIRECTOR' },

  // Alpine Explorers — John is only an organization MEMBER, so these roles are
  // the whole of his access: one camp per role, unmerged.
  { campId: CAMP_IDS.mountainWeeks, userId: USER_IDS.erika, role: 'DIRECTOR' },
  {
    campId: CAMP_IDS.mountainWeeks,
    userId: USER_IDS.john,
    role: 'COORDINATOR',
  },

  { campId: CAMP_IDS.city, userId: USER_IDS.peter, role: 'DIRECTOR' },
  { campId: CAMP_IDS.city, userId: USER_IDS.john, role: 'COUNSELOR' },

  { campId: CAMP_IDS.simple, userId: USER_IDS.erika, role: 'DIRECTOR' },
  { campId: CAMP_IDS.simple, userId: USER_IDS.john, role: 'VIEWER' },

  { campId: CAMP_IDS.glacierTrek, userId: USER_IDS.erika, role: 'DIRECTOR' },
  // Lapsed: the record is still there, the access is not.
  {
    campId: CAMP_IDS.glacierTrek,
    userId: USER_IDS.john,
    role: 'DIRECTOR',
    expiresInDays: -4,
  },

  // Camps of the unverified organizations.
  { campId: CAMP_IDS.printemps, userId: USER_IDS.john, role: 'DIRECTOR' },
  { campId: CAMP_IDS.harbourSailing, userId: USER_IDS.john, role: 'DIRECTOR' },

  // Foreign organization: John must be refused everywhere here.
  { campId: CAMP_IDS.seaside, userId: USER_IDS.tom, role: 'DIRECTOR' },
];

class CampManagerSeeder extends BaseSeeder {
  name(): string {
    return 'camp-manager';
  }

  async run(): Promise<void> {
    for (const manager of MANAGERS) {
      await CampManagerFactory.create({
        camp: { connect: { id: manager.campId } },
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

    await CampManagerFactory.create({
      camp: { connect: { id: CAMP_IDS.summer } },
      invitation: { connect: { id: invitation.id } },
      role: 'COUNSELOR',
    });
  }
}

export default new CampManagerSeeder();
