import { describe, expect, it } from 'vitest';
import { EventFactory } from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { up } from '../../../prisma/migrations/20261120120000_newsletter_consent_purpose/migration.js';

describe('data migration: newsletter_consent_purpose', () => {
  const run = () => prisma.$transaction((tx) => up(tx));
  const formOf = async (id: string) =>
    (await prisma.event.findUniqueOrThrow({ where: { id } })).form;

  it('turns the data tag into a consent purpose, nested ones too', async () => {
    const newsletter = {
      type: 'boolean',
      name: 'newsletter',
      eventDataType: 'newsletter_consent',
    };
    const event = await EventFactory.create({
      form: {
        pages: [
          {
            name: 'p1',
            elements: [
              newsletter,
              {
                type: 'paneldynamic',
                name: 'kids',
                templateElements: [
                  {
                    ...newsletter,
                    name: 'kid_newsletter',
                    privacyConsent: true,
                    privacyConsentPurpose: ['newsletter'],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    await run();

    expect(await formOf(event.id)).toEqual({
      pages: [
        {
          name: 'p1',
          elements: [
            {
              type: 'boolean',
              name: 'newsletter',
              privacyConsent: true,
              privacyConsentPurpose: ['newsletter'],
            },
            {
              type: 'paneldynamic',
              name: 'kids',
              templateElements: [
                {
                  type: 'boolean',
                  name: 'kid_newsletter',
                  privacyConsent: true,
                  privacyConsentPurpose: ['newsletter'],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('leaves other tags and forms without the tag unchanged', async () => {
    const form = {
      pages: [
        {
          name: 'p1',
          elements: [
            { type: 'text', name: 'email', eventDataType: 'email' },
            {
              type: 'expression',
              name: 'calc',
              eventDataType: 'newsletter_consent',
            },
          ],
        },
      ],
    };
    const event = await EventFactory.create({ form });

    await run();

    expect(await formOf(event.id)).toEqual(form);
  });
});
