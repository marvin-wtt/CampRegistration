import { OrganizationFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';

/**
 * The organization every seeded camp and newsletter belongs to. Crockford
 * base32 only — `I`, `L`, `O` and `U` are not valid ULID characters.
 */
export const SEED_ORGANIZATION_ID = '01K9ATF1H9KD1K6H12F3YK8RGZ';
export const SEED_PENDING_ORGANIZATION_ID = '01K9ATF1H9KD1K6H12F3YK8PND';

const JOHN_DOE_USER_ID = '01H4BK7J4WV75DZNAQBHMM99MA';

class OrganizationSeeder extends BaseSeeder {
  name(): string {
    return 'organization';
  }

  async run(): Promise<void> {
    // No legacy organization here: the migration only creates one for databases
    // that already had camps, and a seeded database creates its own.
    await OrganizationFactory.create({
      id: SEED_ORGANIZATION_ID,
      name: 'Youth Adventures',
      verificationStatus: 'VERIFIED',
      members: {
        create: { userId: JOHN_DOE_USER_ID, role: 'ADMIN' },
      },
    });

    // Awaiting moderation: its camps must stay drafts.
    await OrganizationFactory.create({
      id: SEED_PENDING_ORGANIZATION_ID,
      name: 'Nouvelle Association',
      verificationStatus: 'PENDING',
      verificationNote: 'Newly founded, please review our registration papers.',
      members: {
        create: { userId: JOHN_DOE_USER_ID, role: 'ADMIN' },
      },
    });

    await OrganizationFactory.create({
      name: 'Rejected Org',
      verificationStatus: 'REJECTED',
      reviewNote: 'Registration number could not be verified.',
      reviewedAt: new Date(),
    });
  }
}

export default new OrganizationSeeder();
