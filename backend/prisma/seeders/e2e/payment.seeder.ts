import { SETTING_KEYS } from '@camp-registration/common/settings';
import { encryptSecret } from '#core/secrets';
import prisma from '../../client.js';
import { EventFactory, MessageTemplateFactory } from '../../factories';
import { E2E_ORGANIZATION_ID } from './organization.seeder.js';

export const E2E_PAYMENT_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCPAY';

/**
 * The verified organization pays out through the fake provider
 * (`PAYMENT_FAKE_PROVIDER`), and one event charges at registration — enough
 * to walk the whole checkout and return flow without real money.
 */
export async function seedE2ePayments(): Promise<void> {
  await prisma.paymentAccount.create({
    data: {
      organizationId: E2E_ORGANIZATION_ID,
      provider: 'fake',
      mode: 'test',
      displayName: 'Fake payments',
      credentials: await encryptSecret(
        JSON.stringify({ apiKey: 'fake_e2e' }),
        'payment-credentials',
      ),
    },
  });

  await EventFactory.create({
    id: E2E_PAYMENT_EVENT_ID,
    name: 'Paid Event',
    listed: false,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'paid-event@example.com',
    countries: ['de'],
    confirmationMode: 'AUTOMATIC',
    maxParticipants: 100,
    price: 150,
    currency: 'EUR',
    form: {
      name: 'Paid event',
      elements: [
        {
          name: 'first_name',
          type: 'text',
          eventDataType: 'first_name',
          isRequired: true,
        },
        {
          name: 'email',
          type: 'text',
          inputType: 'email',
          eventDataType: 'email',
          isRequired: true,
        },
      ],
    },
    messageTemplates: {
      createMany: {
        data: [
          MessageTemplateFactory.build({
            trigger: 'payment_received',
            country: 'de',
            subject: 'Payment received',
            body: '<p>Thanks for paying {{ payment.amount }}.</p>',
          }),
        ],
      },
    },
    eventSettings: {
      create: {
        key: SETTING_KEYS.PAYMENT,
        data: {
          enabled: true,
          timing: 'REGISTRATION',
          reminderAfterDays: null,
        },
      },
    },
  });
}
