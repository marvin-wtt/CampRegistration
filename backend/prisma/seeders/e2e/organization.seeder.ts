import { OrganizationFactory } from '../../factories';

/**
 * Fixed ids and values — the factory fills unset fields with faker data that
 * changes on every reseed, which would drift the visual baselines.
 * Crockford base32 only: `I`, `L`, `O` and `U` are not valid ULID characters.
 */
export const E2E_ORGANIZATION_ID = '01JHP0CXJFR4MQS8SF1HQJ8RGZ';
export const E2E_PENDING_ORGANIZATION_ID = '01JHP0CXJFR4MQS8SF1HQJ8PND';

export async function seedE2eOrganizations(): Promise<void> {
  await OrganizationFactory.create({
    id: E2E_ORGANIZATION_ID,
    name: 'Verified Organization',
    contactEmail: 'verified-org@example.com',
    phone: '+49 30 111111',
    website: 'https://verified-org.example.com',
    addressStreet: 'Example Street 1',
    addressZipCode: '10115',
    addressCity: 'Berlin',
    registrationNumber: 'VR123456',
    verificationStatus: 'VERIFIED',
  });

  await OrganizationFactory.create({
    id: E2E_PENDING_ORGANIZATION_ID,
    name: 'Pending Organization',
    contactEmail: 'pending-org@example.com',
    phone: '+49 30 222222',
    website: 'https://pending-org.example.com',
    addressStreet: 'Example Street 2',
    addressZipCode: '10115',
    addressCity: 'Berlin',
    registrationNumber: 'VR654321',
    verificationStatus: 'PENDING',
    verificationNote: 'Awaiting moderation.',
  });
}
