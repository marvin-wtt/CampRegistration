import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { createForm } from './utils/form.js';
import { expectEmailWith } from '../utils/mail.js';
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

const paymentForm = createForm([
  { name: 'email', type: 'text', eventDataType: 'email' },
  { name: 'first_name', type: 'text', eventDataType: 'first_name' },
]);

const answers = { email: 'payer@example.com', first_name: 'Pat' };

const settings = (data: Partial<PaymentSettings> = {}): PaymentSettings => ({
  enabled: true,
  timing: 'REGISTRATION',
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
    country: 'de',
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

    it('owes nothing when payments are disabled', async () => {
      const { event } = await createPaymentEvent({ settings: null });

      const body = await register(event);

      expect(body.data.payment.status).toBe('NOT_REQUIRED');
      expect(body.meta.payment).toBeUndefined();
    });

    it('emails the payment link instead when charging after acceptance', async () => {
      const { event } = await createPaymentEvent({
        settings: settings({ timing: 'ACCEPTANCE' }),
      });

      const body = await register(event);

      expect(body.meta.payment?.checkoutUrl).toBeNull();
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

    it('keeps payments when the registration is deleted', async () => {
      const { event } = await createPaymentEvent({ account: false });
      const accessToken = await createManager(event);
      const { registration, payment } = await createPaidRegistration(event);

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      await expect(
        prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }),
      ).resolves.toMatchObject({ registrationId: null });
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
