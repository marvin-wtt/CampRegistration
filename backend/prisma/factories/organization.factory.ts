import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import type { PrivacyNoticeContent } from '@camp-registration/common/privacy';
import {
  PrivacyNoticeFactory,
  completePrivacyNoticeContent,
} from './privacy-notice.factory.js';
import prisma from '../client.js';
import {
  FREE_PRICE_MODEL_ID,
  FREE_PRICE_MODEL_NAME,
} from '#app/priceModel/price-model.utils';

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
      // The seeded free model — recreated here because tests truncate it away.
      priceModel: {
        connectOrCreate: {
          where: { id: FREE_PRICE_MODEL_ID },
          create: { id: FREE_PRICE_MODEL_ID, name: FREE_PRICE_MODEL_NAME },
        },
      },
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
