import { SETTING_KEYS } from '@camp-registration/common/settings';
import { encryptSecret } from '#core/secrets';
import prisma from '../../client.js';
import {
  EventFactory,
  EventManagerFactory,
  MessageTemplateFactory,
  RegistrationFactory,
} from '../../factories';
import { E2E_ORGANIZATION_ID } from './organization.seeder.js';

export const E2E_PAYMENT_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCPAY';

// One registration per balance state, for the manager flows and the visual
// suite. Every rendered field is fixed, so screenshots stay stable.
export const E2E_PAYMENT_REGISTRATIONS = {
  open: '01JHP0CXJFR4MQS8SF1HQJCPR1',
  partial: '01JHP0CXJFR4MQS8SF1HQJCPR2',
  paid: '01JHP0CXJFR4MQS8SF1HQJCPR3',
  overpaid: '01JHP0CXJFR4MQS8SF1HQJCPR4',
} as const;

const JOHN_ID = '01H4BK7J4WV75DZNAQBHMM99MA';
const FEE = 15000;

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
            group: 'de',
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
          timing: 'ACCEPTANCE',
          requestDate: null,
          requestDaysBeforeStart: null,
          reminderAfterDays: null,
        },
      },
    },
  });

  await EventManagerFactory.create({
    user: { connect: { id: JOHN_ID } },
    event: { connect: { id: E2E_PAYMENT_EVENT_ID } },
  });

  await seedRegistration('open', 'Ava', 'Open', []);
  await seedRegistration('partial', 'Ben', 'Partial', [
    { amount: 5000, method: 'cash', paidAt: '2026-09-02T10:00:00Z' },
  ]);
  await seedRegistration('paid', 'Cleo', 'Paid', [
    { amount: FEE, method: 'bank_transfer', paidAt: '2026-09-03T10:00:00Z' },
  ]);
  await seedRegistration('overpaid', 'Dan', 'Overpaid', [
    { amount: FEE, method: 'cash', paidAt: '2026-09-04T10:00:00Z' },
    { amount: FEE, method: 'bank_transfer', paidAt: '2026-09-05T10:00:00Z' },
  ]);
}

async function seedRegistration(
  state: keyof typeof E2E_PAYMENT_REGISTRATIONS,
  firstName: string,
  lastName: string,
  payments: { amount: number; method: string; paidAt: string }[],
): Promise<void> {
  const id = E2E_PAYMENT_REGISTRATIONS[state];
  const email = `${firstName.toLowerCase()}@example.com`;

  await RegistrationFactory.create({
    id,
    firstName,
    lastName,
    emails: [email],
    phoneNumbers: [],
    dateOfBirth: null,
    gender: null,
    street: null,
    city: null,
    zipCode: null,
    country: 'de',
    group: 'de',
    locale: 'en',
    status: 'ACCEPTED',
    data: { first_name: firstName, email },
    quotedAmount: FEE,
    amountDue: FEE,
    paymentRequestedAt: new Date('2026-09-01T10:00:00Z'),
    createdAt: new Date('2026-09-01T09:00:00Z'),
    event: { connect: { id: E2E_PAYMENT_EVENT_ID } },
    payments: {
      create: payments.map((payment) => ({
        event: { connect: { id: E2E_PAYMENT_EVENT_ID } },
        source: 'manual',
        status: 'PAID',
        amount: payment.amount,
        currency: 'EUR',
        method: payment.method,
        paidAt: new Date(payment.paidAt),
        createdAt: new Date(payment.paidAt),
        payerName: `${firstName} ${lastName}`,
        registrationRef: id,
      })),
    },
  });
}
