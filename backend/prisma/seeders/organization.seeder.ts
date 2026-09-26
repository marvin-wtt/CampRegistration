import { OrganizationFactory } from '../factories';
import prisma from '../client';
import { BaseSeeder } from './BaseSeeder';
import { ORGANIZATION_IDS, USER_IDS } from './ids';
import { seedDate } from './timeline';

class OrganizationSeeder extends BaseSeeder {
  name(): string {
    return 'organization';
  }

  async run(): Promise<void> {
    // No legacy organization here: the migration only creates one for databases
    // that already had events, and a seeded database creates its own.

    // John administers this one — implicit ORGANIZATION_EVENT_PERMISSIONS on
    // every event it owns, even the ones he does not manage.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.youthAdventures,
      name: 'Youth Adventures',
      verificationStatus: 'VERIFIED',
      contactEmail: 'office@youth-adventures.example.com',
      website: 'https://youth-adventures.example.com',
      country: 'gb',
      addressCity: 'Bristol',
      reviewedAt: seedDate(-200),
      reviewedBy: { connect: { id: USER_IDS.admin } },
      members: {
        create: [
          { userId: USER_IDS.john, role: 'ADMIN' },
          { userId: USER_IDS.erika, role: 'MEMBER' },
          { userId: USER_IDS.peter, role: 'MEMBER' },
        ],
      },
    });

    // Someone invited by email who has not registered yet: the members list
    // shows them as PENDING.
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: ORGANIZATION_IDS.youthAdventures,
        email: 'newcomer@example.com',
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: ORGANIZATION_IDS.youthAdventures,
        invitationId: invitation.id,
        role: 'MEMBER',
      },
    });

    // John is a plain MEMBER here: he may create events for the organization but
    // holds nothing implicit on the events it already owns.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.alpineExplorers,
      name: 'Alpine Explorers',
      verificationStatus: 'VERIFIED',
      contactEmail: 'buero@alpine-explorers.example.com',
      country: 'de',
      addressCity: 'Garmisch-Partenkirchen',
      reviewedAt: seedDate(-120),
      reviewedBy: { connect: { id: USER_IDS.admin } },
      members: {
        create: [
          { userId: USER_IDS.erika, role: 'ADMIN' },
          { userId: USER_IDS.john, role: 'MEMBER' },
        ],
      },
    });

    // Awaiting moderation: its events stay out of the public directory and
    // refuse registrations, its newsletter refuses to send.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.nouvelleAssociation,
      name: 'Nouvelle Association',
      verificationStatus: 'PENDING',
      verificationNote: 'Newly founded, please review our registration papers.',
      contactEmail: 'bonjour@nouvelle-association.example.com',
      country: 'fr',
      addressCity: 'Lyon',
      submittedAt: seedDate(-6),
      members: {
        create: { userId: USER_IDS.john, role: 'ADMIN' },
      },
    });

    // Rejected after review — the rejection unpublished its events.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.harbourTrust,
      name: 'Harbour Youth Trust',
      verificationStatus: 'REJECTED',
      reviewNote: 'Registration number could not be verified.',
      reviewedAt: seedDate(-14),
      reviewedBy: { connect: { id: USER_IDS.admin } },
      contactEmail: 'contact@harbour-trust.example.com',
      country: 'gb',
      addressCity: 'Plymouth',
      members: {
        create: { userId: USER_IDS.john, role: 'ADMIN' },
      },
    });

    // John is not a member: its event shows up in the public directory but every
    // management route must refuse him.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.coastalEvents,
      name: 'Coastal Events',
      verificationStatus: 'VERIFIED',
      contactEmail: 'hello@coastal-events.example.com',
      country: 'gb',
      addressCity: 'Brighton',
      reviewedAt: seedDate(-90),
      reviewedBy: { connect: { id: USER_IDS.admin } },
      members: {
        create: { userId: USER_IDS.tom, role: 'ADMIN' },
      },
    });

    // Second item in the administrator's moderation queue.
    await OrganizationFactory.create({
      id: ORGANIZATION_IDS.bergfreunde,
      name: 'Bergfreunde e.V.',
      verificationStatus: 'PENDING',
      verificationNote: 'Eingetragener Verein seit 1998.',
      contactEmail: 'vorstand@bergfreunde.example.com',
      country: 'de',
      addressCity: 'Kempten',
      submittedAt: seedDate(-2),
      members: {
        create: { userId: USER_IDS.maria, role: 'ADMIN' },
      },
    });
  }
}

export default new OrganizationSeeder();
