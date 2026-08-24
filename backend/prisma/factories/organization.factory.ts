import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import type { PrivacyNoticeContent } from '@camp-registration/common/privacy';
import {
  PrivacyNoticeFactory,
  completePrivacyNoticeContent,
} from './privacy-notice.factory.js';
import prisma from '../client.js';

interface OrganizationFactoryOptions {
  /**
   * The notice to publish for the organization, or `null` for none — the state
   * that blocks verification. Defaults to a complete one, because an
   * organization without a published notice cannot be verified and that is the
   * uncommon case in tests.
   */
  privacyNotice?: PrivacyNoticeContent | null;
}

export const OrganizationFactory = {
  build: (
    data: Partial<Prisma.OrganizationCreateInput> = {},
  ): Prisma.OrganizationCreateInput => {
    return {
      name: faker.company.name(),
      verificationStatus: 'VERIFIED',
      contactEmail: faker.internet.email(),
      phone: faker.phone.number(),
      website: faker.internet.url(),
      country: 'de',
      addressStreet: faker.location.streetAddress(),
      addressZipCode: faker.location.zipCode(),
      addressCity: faker.location.city(),
      registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
      ...data,
    };
  },

  create: async (
    data: Partial<Prisma.OrganizationCreateInput> = {},
    options: OrganizationFactoryOptions = {},
  ) => {
    const organization = await prisma.organization.create({
      data: OrganizationFactory.build(data),
    });

    const { privacyNotice = completePrivacyNoticeContent() } = options;
    if (privacyNotice) {
      await PrivacyNoticeFactory.createPublished(
        organization.id,
        privacyNotice,
      );
    }

    return organization;
  },
};
