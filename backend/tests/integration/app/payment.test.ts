import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { createForm } from './utils/form.js';
import { expectEmailWith, expectNoEmailWith } from '../utils/mail.js';
import {
  EventFactory,
  EventManagerFactory,
  EventSettingFactory,
  MessageTemplateFactory,
  OrganizationFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import type {
  Event,
  OrganizationVerificationStatus,
  Prisma,
} from '#generated/prisma/client.js';
import type { PaymentSettings } from '@camp-registration/common/settings';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { encryptSecret } from '#core/secrets';
import { signPaymentToken } from '#app/payment/payment-link';
import { resolve } from '#core/ioc/container';
import { PaymentReminderService } from '#app/payment/payment-reminder.service';
import { PaymentService } from '#app/payment/payment.service';

const paymentForm = createForm([
  { name: 'email', type: 'text', eventDataType: 'email' },
  { name: 'first_name', type: 'text', eventDataType: 'first_name' },
]);

const answers = { email: 'payer@example.com', first_name: 'Pat' };

const settings = (data: Partial<PaymentSettings> = {}): PaymentSettings => ({
  enabled: true,
  timing: 'ACCEPTANCE',
  requestDate: null,
  requestDaysBeforeStart: null,
  reminderAfterDays: null,
  ...data,
});

const templates = [
  'payment_requested',
  'payment_received',
  'payment_failed',
  'payment_refunded',
].map((trigger) =>
  MessageTemplateFactory.build({
    trigger,
    group: 'de',
    subject: trigger,
  }),
);

interface PaymentEventOptions {
  settings?: PaymentSettings | null;
  account?: boolean;
  verificationStatus?: OrganizationVerificationStatus;
  event?: Partial<Prisma.EventCreateInput>;
}

const createPaymentEvent = async ({
  settings: paymentSettings = settings(),
  account = true,
  verificationStatus = 'VERIFIED',
  event: eventData = {},
}: PaymentEventOptions = {}) => {
  const organization = await OrganizationFactory.create({ verificationStatus });
  const event = await EventFactory.create({
    organization: { connect: { id: organization.id } },
    countries: ['de'],
    confirmationMode: 'AUTOMATIC',
    maxParticipants: 100,
    price: 150,
    currency: 'EUR',
    form: paymentForm,
    messageTemplates: { createMany: { data: templates } },
    ...eventData,
  });

  if (paymentSettings) {
    await EventSettingFactory.create({
      event: { connect: { id: event.id } },
      key: SETTING_KEYS.PAYMENT,
      data: { ...paymentSettings },
    });
  }

  if (account) {
    await prisma.paymentAccount.create({
      data: {
        organizationId: organization.id,
        provider: 'fake',
        mode: 'test',
        displayName: 'Fake payments',
        credentials: await encryptSecret(
          JSON.stringify({ apiKey: 'fake_key' }),
          'payment-credentials',
        ),
      },
    });
  }

  return { organization, event };
};

const createManager = async (event: Event, role = 'DIRECTOR') => {
  const user = await UserFactory.create();
  await EventManagerFactory.create({
    event: { connect: { id: event.id } },
    user: { connect: { id: user.id } },
    role,
  });

  return generateAccessToken(user);
};

const createPaidRegistration = async (event: Event, amount = 15000) => {
  const registration = await RegistrationFactory.create({
    event: { connect: { id: event.id } },
    status: 'ACCEPTED',
    amountDue: amount,
    emails: [answers.email],
  });
  const payment = await prisma.payment.create({
    data: {
      registrationId: registration.id,
      eventId: event.id,
      source: 'manual',
      status: 'PAID',
      amount,
      currency: 'EUR',
      paidAt: new Date(),
    },
  });

  return { registration, payment };
};

const register = async (event: Event) => {
  const { body } = await request()
    .post(`/api/v1/events/${event.id}/registrations`)
    .send({ data: answers })
    .expect(201);

  return body as {
    data: { id: string; payment: { status: string; amountDue: number } };
    meta: { payment?: { checkoutUrl: string | null; pageUrl: string } };
  };
};

const paymentPath = (event: Event, registrationId: string) =>
  `/api/v1/events/${event.id}/registrations/${registrationId}/payment`;

const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('payments', () => {
  describe('registration', () => {
    it('snapshots the amount due and opens a checkout at registration', async () => {
      const { event } = await createPaymentEvent();

      const body = await register(event);

      expect(body.data.payment).toMatchObject({
        status: 'UNPAID',
        amountDue: 15000,
      });
      expect(body.meta.payment?.checkoutUrl).toContain(
        '/webhooks/payments/fake/checkout/',
      );
      const payments = await prisma.payment.findMany({
        where: { registrationId: body.data.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({ status: 'OPEN', amount: 15000 });
    });

    it('quotes the price but asks nobody while payments are disabled', async () => {
      const { event } = await createPaymentEvent({ settings: null });

      const body = await register(event);

      expect(body.data.payment).toMatchObject({
        amountDue: 15000,
        quotedAmount: 15000,
      });
      expect(body.meta.payment).toBeUndefined();
      expectNoEmailWith({ to: answers.email, subject: 'payment_requested' });
    });

    it('refuses a checkout while payments are disabled', async () => {
      const { event } = await createPaymentEvent({ settings: null });
      const body = await register(event);

      await request()
        .post(`${paymentPath(event, body.data.id)}/checkout`)
        .query({ token: signPaymentToken(body.data.id) })
        .expect(409);
    });

    it('asks for payment only once a manager accepts', async () => {
      const { event } = await createPaymentEvent({
        event: { confirmationMode: 'MANUAL' },
      });
      const accessToken = await createManager(event);

      const body = await register(event);

      expect(body.meta.payment?.checkoutUrl).toBeNull();
      expectNoEmailWith({ to: answers.email, subject: 'payment_requested' });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${body.data.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      expectEmailWith({ to: answers.email, subject: 'payment_requested' });
    });

    it('emails the payment link with the checkout when accepted on submit', async () => {
      const { event } = await createPaymentEvent();

      const body = await register(event);

      expect(body.meta.payment?.checkoutUrl).toBeTruthy();
      expectEmailWith({ to: answers.email, subject: 'payment_requested' });
    });

    it('still registers when the organization has no payment account', async () => {
      const { event } = await createPaymentEvent({ account: false });

      const body = await register(event);

      expect(body.meta.payment?.checkoutUrl).toBeNull();
      expect(body.meta.payment?.pageUrl).toContain('token=');
    });
  });

  describe('participant payment page', () => {
    it('reconciles a completed checkout on return and emails a receipt', async () => {
      const { event } = await createPaymentEvent();
      const body = await register(event);
      const checkoutPath = new URL(body.meta.payment!.checkoutUrl!).pathname;

      await request().get(`${checkoutPath}/complete?outcome=paid`).expect(303);

      const token = signPaymentToken(body.data.id);
      const { body: summary } = await request()
        .get(paymentPath(event, body.data.id))
        .query({ token })
        .expect(200);

      expect(summary.data).toMatchObject({
        status: 'PAID',
        amountPaid: 15000,
        latestPaymentStatus: 'PAID',
        payable: false,
      });
      expectEmailWith({ to: answers.email, subject: 'payment_received' });
    });

    it('rejects an invalid token', async () => {
      const { event } = await createPaymentEvent();
      const body = await register(event);

      await request()
        .get(paymentPath(event, body.data.id))
        .query({ token: 'nope' })
        .expect(401);
    });

    it('refuses a checkout without a connected account', async () => {
      const { event } = await createPaymentEvent({
        account: false,
        settings: settings({ timing: 'ACCEPTANCE' }),
      });
      const body = await register(event);

      const { body: error } = await request()
        .post(`${paymentPath(event, body.data.id)}/checkout`)
        .query({ token: signPaymentToken(body.data.id) })
        .expect(409);

      expect(error.errorCode).toBe('PAYMENT_NO_ACCOUNT');
    });

    it('refuses a checkout for an unverified organization', async () => {
      const { event } = await createPaymentEvent({ settings: null });
      const registration = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        status: 'ACCEPTED',
        amountDue: 1000,
      });
      await prisma.organization.update({
        where: { id: event.organizationId },
        data: { verificationStatus: 'PENDING' },
      });

      await request()
        .post(`${paymentPath(event, registration.id)}/checkout`)
        .query({ token: signPaymentToken(registration.id) })
        .expect(409);
    });

    it('reuses an open checkout instead of creating another', async () => {
      const { event } = await createPaymentEvent();
      const body = await register(event);
      const token = signPaymentToken(body.data.id);

      const { body: checkout } = await request()
        .post(`${paymentPath(event, body.data.id)}/checkout`)
        .query({ token })
        .expect(200);

      expect(checkout.data.checkoutUrl).toBe(body.meta.payment?.checkoutUrl);
      expect(
        await prisma.payment.count({ where: { registrationId: body.data.id } }),
      ).toBe(1);
    });
  });

  describe('webhooks', () => {
    it('responds 404 for an unknown account', async () => {
      await request()
        .post('/api/v1/webhooks/payments/fake/01J00000000000000000000000')
        .send({ id: 'fake_x' })
        .expect(404);
    });

    it('syncs a payment the provider reports', async () => {
      const { event } = await createPaymentEvent();
      const body = await register(event);
      const payment = await prisma.payment.findFirstOrThrow({
        where: { registrationId: body.data.id },
      });
      const account = await prisma.paymentAccount.findFirstOrThrow({
        where: { organizationId: event.organizationId },
      });
      const checkoutPath = new URL(body.meta.payment!.checkoutUrl!).pathname;
      await request()
        .get(`${checkoutPath}/complete?outcome=failed`)
        .expect(303);

      await request()
        .post(`/api/v1/webhooks/payments/fake/${account.id}`)
        .send({ id: payment.providerPaymentId })
        .expect(200);

      await expect(
        prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }),
      ).resolves.toMatchObject({ status: 'FAILED' });
    });
  });

  describe('management', () => {
    it.each([
      { role: 'DIRECTOR', status: 201 },
      { role: 'COORDINATOR', status: 201 },
      { role: 'COUNSELOR', status: 403 },
      { role: 'VIEWER', status: 403 },
    ])(
      'lets a $role record a manual payment: $status',
      async ({ role, status }) => {
        const { event } = await createPaymentEvent({ account: false });
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          amountDue: 15000,
        });
        const accessToken = await createManager(event, role);

        await request()
          .post(
            `/api/v1/events/${event.id}/registrations/${registration.id}/payments`,
          )
          .send({ amount: 150, method: 'bank_transfer' })
          .auth(accessToken, { type: 'bearer' })
          .expect(status);
      },
    );

    it('reflects a manual payment in the registration', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const { registration } = await createPaidRegistration(event);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.payment).toEqual({
        status: 'PAID',
        currency: 'EUR',
        amountDue: 15000,
        amountPaid: 15000,
        adjustment: null,
      });
    });

    it('does not let an organization admin read payments', async () => {
      const { event, organization } = await createPaymentEvent();
      const user = await UserFactory.create();
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'ADMIN',
        },
      });

      await request()
        .get(`/api/v1/events/${event.id}/payments`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
    });

    const deletePath = (event: Event, registrationId: string) =>
      `/api/v1/events/${event.id}/registrations/${registrationId}`;

    it('refuses to delete a registration holding money unsettled', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const { registration } = await createPaidRegistration(event);

      const { body } = await request()
        .delete(deletePath(event, registration.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(409);

      expect(body.errorCode).toBe('PAYMENT_SETTLEMENT_REQUIRED');
      await expect(
        prisma.registration.count({ where: { id: registration.id } }),
      ).resolves.toBe(1);
    });

    it('keeps retained payments with their payer after deletion', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const registration = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        status: 'ACCEPTED',
        amountDue: 15000,
        firstName: 'Pat',
        lastName: 'Payer',
      });
      const { body } = await request()
        .post(`${deletePath(event, registration.id)}/payments`)
        .send({ amount: 150, method: 'cash' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      await request()
        .delete(deletePath(event, registration.id))
        .query({ paymentSettlement: 'retained', reason: 'canceled' })
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      await expect(
        prisma.payment.findUniqueOrThrow({ where: { id: body.data.id } }),
      ).resolves.toMatchObject({
        registrationId: null,
        registrationRef: registration.id,
        payerName: 'Pat Payer',
        settlement: 'retained',
      });
      const deleted = await prisma.auditLog.findFirstOrThrow({
        where: { entityId: registration.id, action: 'deleted' },
      });
      expect(deleted.details).toMatchObject({
        context: { paymentSettlement: 'retained' },
      });
    });

    it('books money settled outside the app as refunded', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const { registration, payment } = await createPaidRegistration(event);

      await request()
        .delete(deletePath(event, registration.id))
        .query({ paymentSettlement: 'settled_outside' })
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const refunds = await prisma.paymentRefund.findMany({
        where: { paymentId: payment.id },
      });
      expect(refunds).toEqual([
        expect.objectContaining({ status: 'REFUNDED', amount: 15000 }),
      ]);
    });

    it('deletes a registration without money held as before', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const registration = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        amountDue: 15000,
      });

      await request()
        .delete(deletePath(event, registration.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('removes the payer of a deleted registration after the retention period', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const payment = await prisma.payment.create({
        data: {
          eventId: event.id,
          source: 'manual',
          status: 'PAID',
          amount: 15000,
          currency: 'EUR',
          payerName: 'Pat Payer',
          registrationRef: '01JHP0CXJFR4MQS8SF1HQJCAAA',
          createdAt: new Date('2010-01-01T00:00:00Z'),
        },
      });

      await resolve(PaymentService).anonymizeExpiredPayers();

      await expect(
        prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }),
      ).resolves.toMatchObject({
        payerName: null,
        registrationRef: null,
        amount: 15000,
      });
    });

    it('refuses to delete an event that received payments', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      await createPaidRegistration(event);

      const { body } = await request()
        .delete(`/api/v1/events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);

      expect(body.errorCode).toBe('EVENT_HAS_PAYMENTS');
    });
  });

  describe('refunds', () => {
    const refundPath = (
      event: Event,
      registrationId: string,
      paymentId: string,
    ) =>
      `/api/v1/events/${event.id}/registrations/${registrationId}/payments/${paymentId}/refunds`;

    it('lets only the director refund', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const { registration, payment } = await createPaidRegistration(event);
      const accessToken = await createManager(event, 'COORDINATOR');

      await request()
        .post(refundPath(event, registration.id, payment.id))
        .send({ amount: 1000 })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('records a manual refund at once and emails the participant', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const { registration, payment } = await createPaidRegistration(event);
      const accessToken = await createManager(event);

      const { body } = await request()
        .post(refundPath(event, registration.id, payment.id))
        .send({ amount: 15000, reason: 'Canceled' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        amountRefunded: 15000,
        refunds: [{ status: 'REFUNDED', amount: 15000, reason: 'Canceled' }],
      });
      expectEmailWith({ to: answers.email, subject: 'payment_refunded' });

      const { body: fetched } = await request()
        .get(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      expect(fetched.data.payment.status).toBe('REFUNDED');
    });

    it('rejects refunding more than was paid', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const { registration, payment } = await createPaidRegistration(event);
      const accessToken = await createManager(event);

      const { body } = await request()
        .post(refundPath(event, registration.id, payment.id))
        .send({ amount: 15001 })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);

      expect(body.errorCode).toBe('PAYMENT_REFUND_EXCEEDS');
    });

    it('refunds through the provider and completes on its webhook', async () => {
      const { event } = await createPaymentEvent();
      const accessToken = await createManager(event);
      const body = await register(event);
      const checkoutPath = new URL(body.meta.payment!.checkoutUrl!).pathname;
      await request().get(`${checkoutPath}/complete?outcome=paid`).expect(303);
      await request()
        .get(paymentPath(event, body.data.id))
        .query({ token: signPaymentToken(body.data.id) })
        .expect(200);
      const payment = await prisma.payment.findFirstOrThrow({
        where: { registrationId: body.data.id },
      });
      const account = await prisma.paymentAccount.findFirstOrThrow({
        where: { organizationId: event.organizationId },
      });

      const { body: refunded } = await request()
        .post(refundPath(event, body.data.id, payment.id))
        .send({ amount: 5000 })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);
      expect(refunded.data.refunds[0].status).toBe('PENDING');

      await settle();
      await request()
        .post(`/api/v1/webhooks/payments/fake/${account.id}`)
        .send({ id: payment.providerPaymentId })
        .expect(200);

      const refund = await prisma.paymentRefund.findFirstOrThrow({
        where: { paymentId: payment.id },
      });
      expect(refund).toMatchObject({ status: 'REFUNDED', amount: 5000 });
      expectEmailWith({ to: answers.email, subject: 'payment_refunded' });
    });
  });

  describe('organization payment account', () => {
    const accountPath = (organizationId: string) =>
      `/api/v1/organizations/${organizationId}/payment-account`;

    const createOrganizationMember = async (role: 'ADMIN' | 'MEMBER') => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role } },
      });

      return { organization, accessToken: generateAccessToken(user) };
    };

    it('connects an account without ever returning the key', async () => {
      const { organization, accessToken } =
        await createOrganizationMember('ADMIN');

      const { body } = await request()
        .put(accountPath(organization.id))
        .send({ provider: 'fake', apiKey: 'fake_secret_key' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({ provider: 'fake', mode: 'test' });
      expect(JSON.stringify(body)).not.toContain('fake_secret_key');
      const stored = await prisma.paymentAccount.findUniqueOrThrow({
        where: { organizationId: organization.id },
      });
      expect(stored.credentials).not.toContain('fake_secret_key');
    });

    it('rejects an invalid key', async () => {
      const { organization, accessToken } =
        await createOrganizationMember('ADMIN');

      await request()
        .put(accountPath(organization.id))
        .send({ provider: 'fake', apiKey: 'wrong' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('does not let members connect accounts', async () => {
      const { organization, accessToken } =
        await createOrganizationMember('MEMBER');

      await request()
        .put(accountPath(organization.id))
        .send({ provider: 'fake', apiKey: 'fake_key' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('disconnects the account', async () => {
      const { organization, accessToken } =
        await createOrganizationMember('ADMIN');
      await request()
        .put(accountPath(organization.id))
        .send({ provider: 'fake', apiKey: 'fake_key' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      await request()
        .delete(accountPath(organization.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const { body } = await request()
        .get(accountPath(organization.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      expect(body.data).toBeNull();
    });
  });
});
describe('payment timing', () => {
  const sendDueRequests = (now: Date) =>
    resolve(PaymentReminderService).sendDueRequests(now);

  it('waits for a fixed request date, then the daily job asks', async () => {
    const { event } = await createPaymentEvent({
      settings: settings({ timing: 'DATE', requestDate: '2099-05-01' }),
    });

    const body = await register(event);

    expect(body.meta.payment?.checkoutUrl).toBeNull();
    expectNoEmailWith({ to: answers.email, subject: 'payment_requested' });

    await sendDueRequests(new Date('2099-04-30T12:00:00Z'));
    await settle();
    expectNoEmailWith({ to: answers.email, subject: 'payment_requested' });

    await sendDueRequests(new Date('2099-05-01T12:00:00Z'));
    await settle();
    expectEmailWith({ to: answers.email, subject: 'payment_requested' });
    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: body.data.id },
    });
    expect(registration.paymentRequestedAt).not.toBeNull();
  });

  it('asks right away once the request date has passed', async () => {
    const { event } = await createPaymentEvent({
      settings: settings({ timing: 'DATE', requestDate: '2000-01-01' }),
    });

    await register(event);

    expectEmailWith({ to: answers.email, subject: 'payment_requested' });
  });

  it('counts the days before the start', async () => {
    const { event } = await createPaymentEvent({
      settings: settings({
        timing: 'BEFORE_START',
        requestDaysBeforeStart: 30,
      }),
      event: {
        startAt: new Date('2099-07-10T10:00:00Z'),
        endAt: new Date('2099-07-20T10:00:00Z'),
      },
    });
    await register(event);

    await sendDueRequests(new Date('2099-06-09T12:00:00Z'));
    await settle();
    expectNoEmailWith({ to: answers.email, subject: 'payment_requested' });

    await sendDueRequests(new Date('2099-06-10T12:00:00Z'));
    await settle();
    expectEmailWith({ to: answers.email, subject: 'payment_requested' });
  });

  it('refuses a checkout before the request date', async () => {
    const { event } = await createPaymentEvent({
      settings: settings({ timing: 'DATE', requestDate: '2099-05-01' }),
    });
    const body = await register(event);

    await request()
      .post(`${paymentPath(event, body.data.id)}/checkout`)
      .query({ token: signPaymentToken(body.data.id) })
      .expect(409);
  });

  it('rejects a date-based timing without its date', async () => {
    const { event } = await createPaymentEvent();
    const accessToken = await createManager(event);

    await request()
      .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.PAYMENT}`)
      .send({ data: settings({ timing: 'DATE' }) })
      .auth(accessToken, { type: 'bearer' })
      .expect(400);
  });
});

describe('amount due adjustments', () => {
  const amountDuePath = (event: Event, registrationId: string) =>
    `/api/v1/events/${event.id}/registrations/${registrationId}/payments/amount-due`;

  it.each([
    { role: 'DIRECTOR', status: 204 },
    { role: 'COORDINATOR', status: 403 },
    { role: 'VIEWER', status: 403 },
  ])('lets a $role set the amount due: $status', async ({ role, status }) => {
    const { event } = await createPaymentEvent({ account: false });
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      amountDue: 15000,
    });
    const accessToken = await createManager(event, role);

    await request()
      .put(amountDuePath(event, registration.id))
      .send({ amount: 0, note: 'Team member' })
      .auth(accessToken, { type: 'bearer' })
      .expect(status);
  });

  it('keeps a set amount when the answers are edited', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);
    const { data } = await register(event);

    await request()
      .put(amountDuePath(event, data.id))
      .send({ amount: 20, note: 'Hardship' })
      .auth(accessToken, { type: 'bearer' })
      .expect(204);
    await request()
      .patch(`/api/v1/events/${event.id}/registrations/${data.id}`)
      .send({ data: { ...answers, first_name: 'Patricia' } })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    const { body } = await request()
      .get(`/api/v1/events/${event.id}/registrations/${data.id}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(body.data.payment).toMatchObject({
      amountDue: 2000,
      adjustment: { note: 'Hardship' },
    });
  });

  it('resets to the quote on request', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);
    const { data } = await register(event);

    await request()
      .put(amountDuePath(event, data.id))
      .send({ amount: 0 })
      .auth(accessToken, { type: 'bearer' })
      .expect(204);
    await request()
      .put(amountDuePath(event, data.id))
      .send({ amount: null })
      .auth(accessToken, { type: 'bearer' })
      .expect(204);

    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: data.id },
    });
    expect(registration).toMatchObject({
      amountDue: 15000,
      amountDueAdjustedAt: null,
      amountDueNote: null,
    });
  });
});

describe('payment audit', () => {
  const entries = async (registrationId: string) =>
    (
      await prisma.auditLog.findMany({
        where: { entityType: 'registration', entityId: registrationId },
        orderBy: { createdAt: 'asc' },
      })
    ).map(({ action, actorId, details }) => ({ action, actorId, details }));

  it('records manual payments and refunds with their amounts', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      amountDue: 15000,
    });
    const accessToken = await createManager(event);
    const base = `/api/v1/events/${event.id}/registrations/${registration.id}/payments`;

    const { body } = await request()
      .post(base)
      .send({ amount: 150, method: 'cash', note: 'Paid at the desk' })
      .auth(accessToken, { type: 'bearer' })
      .expect(201);
    await request()
      .post(`${base}/${body.data.id}/refunds`)
      .send({ amount: 5000, reason: 'Left early' })
      .auth(accessToken, { type: 'bearer' })
      .expect(201);

    expect(await entries(registration.id)).toEqual([
      expect.objectContaining({
        action: 'payment_recorded',
        details: { values: { amount: 15000 } },
      }),
      expect.objectContaining({
        action: 'payment_refunded',
        details: { values: { amount: 5000 } },
      }),
    ]);
  });

  it('records a deleted manual payment', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const { registration, payment } = await createPaidRegistration(event);
    const accessToken = await createManager(event);

    await request()
      .delete(
        `/api/v1/events/${event.id}/registrations/${registration.id}/payments/${payment.id}`,
      )
      .auth(accessToken, { type: 'bearer' })
      .expect(204);

    expect(await entries(registration.id)).toEqual([
      expect.objectContaining({
        action: 'payment_deleted',
        details: { values: { amount: 15000 } },
      }),
    ]);
  });

  it('records an amount adjustment without its note', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      amountDue: 15000,
    });
    const accessToken = await createManager(event);

    await request()
      .put(
        `/api/v1/events/${event.id}/registrations/${registration.id}/payments/amount-due`,
      )
      .send({ amount: 0, note: 'Team member' })
      .auth(accessToken, { type: 'bearer' })
      .expect(204);

    expect(await entries(registration.id)).toEqual([
      expect.objectContaining({
        action: 'amount_due_adjusted',
        details: { values: { amountDue: 0 } },
      }),
    ]);
  });

  it('records a provider status change as a system entry', async () => {
    const { event } = await createPaymentEvent();
    const body = await register(event);
    const checkoutPath = new URL(body.meta.payment!.checkoutUrl!).pathname;

    await request().get(`${checkoutPath}/complete?outcome=paid`).expect(303);
    await request()
      .get(paymentPath(event, body.data.id))
      .query({ token: signPaymentToken(body.data.id) })
      .expect(200);

    expect(await entries(body.data.id)).toContainEqual({
      action: 'payment_status_changed',
      actorId: null,
      details: { values: { paymentStatus: 'PAID', amount: 15000 } },
    });
  });
});

describe('price check', () => {
  const submit = (event: Event, displayedTotal: number) =>
    request()
      .post(`/api/v1/events/${event.id}/registrations`)
      .send({ data: answers, priceCheck: { displayedTotal } });

  it('registers when the form showed the server quote', async () => {
    const { event } = await createPaymentEvent();

    const { body } = await submit(event, 15000).expect(201);

    expect(body.data.payment.quotedAmount).toBe(15000);
  });

  it('refuses a changed price with the quote, registering nobody', async () => {
    const { event } = await createPaymentEvent();

    const { body } = await submit(event, 12000).expect(409);

    expect(body).toMatchObject({
      errorCode: 'REGISTRATION_PRICE_CHANGED',
      details: { quotedAmount: 15000 },
    });
    expect(await prisma.registration.count()).toBe(0);
  });

  it('never charges a displayed total, however low', async () => {
    const { event } = await createPaymentEvent();

    await submit(event, 1).expect(409);
    const { body } = await submit(event, 15000).expect(201);

    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: body.data.id },
    });
    expect(registration).toMatchObject({
      quotedAmount: 15000,
      amountDue: 15000,
    });
  });

  it('rejects anything but a displayed total', async () => {
    const { event } = await createPaymentEvent();

    await request()
      .post(`/api/v1/events/${event.id}/registrations`)
      .send({ data: answers, priceCheck: { displayedTotal: 1, amountDue: 1 } })
      .expect(400);
  });
});

describe('the quote', () => {
  it('is not re-priced when the price or the answers change', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);
    const { data } = await register(event);

    await prisma.event.update({
      where: { id: event.id },
      data: { price: 300 },
    });
    await request()
      .patch(`/api/v1/events/${event.id}/registrations/${data.id}`)
      .send({ data: { ...answers, first_name: 'Patricia' } })
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: data.id },
    });
    expect(registration).toMatchObject({
      quotedAmount: 15000,
      amountDue: 15000,
    });
  });
});

describe('requesting payment from every accepted registration', () => {
  const requestAllPath = (event: Event) =>
    `/api/v1/events/${event.id}/payments/request`;

  it('asks those accepted before payments were on, once', async () => {
    const { event } = await createPaymentEvent({ settings: null });
    const accessToken = await createManager(event);
    const { data } = await register(event);
    await EventSettingFactory.create({
      event: { connect: { id: event.id } },
      key: SETTING_KEYS.PAYMENT,
      data: { ...settings() },
    });

    const { body: status } = await request()
      .get(`/api/v1/events/${event.id}/payments/status`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(status.data.unrequested).toBe(1);

    const { body } = await request()
      .post(requestAllPath(event))
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(body.data.requested).toBe(1);
    expectEmailWith({ to: answers.email, subject: 'payment_requested' });

    const { body: again } = await request()
      .post(requestAllPath(event))
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(again.data.requested).toBe(0);
    expect(
      (await prisma.registration.findUniqueOrThrow({ where: { id: data.id } }))
        .paymentRequestedAt,
    ).not.toBeNull();
  });

  it('refuses before the request date', async () => {
    const { event } = await createPaymentEvent({
      settings: settings({ timing: 'DATE', requestDate: '2099-05-01' }),
    });
    const accessToken = await createManager(event);

    await request()
      .post(requestAllPath(event))
      .auth(accessToken, { type: 'bearer' })
      .expect(409);
  });

  it('is not for viewers', async () => {
    const { event } = await createPaymentEvent();
    const accessToken = await createManager(event, 'VIEWER');

    await request()
      .post(requestAllPath(event))
      .auth(accessToken, { type: 'bearer' })
      .expect(403);
  });
});

describe('event currency', () => {
  const update = (event: Event, accessToken: string, currency: string) =>
    request()
      .patch(`/api/v1/events/${event.id}`)
      .send({ currency })
      .auth(accessToken, { type: 'bearer' });

  it('can change while nothing was quoted or paid', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);

    await update(event, accessToken, 'CHF').expect(200);
  });

  it('is fixed once an amount was quoted', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);
    await register(event);

    const { body } = await update(event, accessToken, 'CHF').expect(409);

    expect(body.errorCode).toBe('EVENT_CURRENCY_LOCKED');
  });

  it('accepts only two-decimal currencies', async () => {
    const { event } = await createPaymentEvent({ account: false });
    const accessToken = await createManager(event);

    await update(event, accessToken, 'JPY').expect(400);
  });
});
