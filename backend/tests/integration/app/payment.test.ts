import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { resolve } from '#core/ioc/container';
import { PaymentService } from '#app/payment/payment.service';
import type { Event, Registration } from '#generated/prisma/client.js';
import type {
  Payment,
  RegistrationFee,
} from '@camp-registration/common/entities';

describe('payments', () => {
  const addManager = async (event: Event, role: string) => {
    const user = await UserFactory.create();
    await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return generateAccessToken(user);
  };

  const setup = async (role = 'DIRECTOR') => {
    const event = await EventFactory.create({ currency: 'EUR' });
    const token = await addManager(event, role);
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      quotedAmount: 20000,
      currency: 'EUR',
      data: { secret: 'never in the fees view' },
    });

    return { event, token, registration };
  };

  const feeUrl = (event: Event, registration: Registration) =>
    `/api/v1/events/${event.id}/payments/registrations/${registration.id}`;

  const pay = async (
    event: Event,
    registration: Registration,
    token: string,
    amount: number,
  ) => {
    const { body } = await request()
      .post(feeUrl(event, registration))
      .send({ amount, method: 'BANK_TRANSFER', paidOn: '2026-06-01' })
      .auth(token, { type: 'bearer' })
      .expect(201);

    return body.data as RegistrationFee;
  };

  const refund = (
    event: Event,
    payment: Payment,
    token: string,
    data: Record<string, unknown>,
  ) =>
    request()
      .post(`/api/v1/events/${event.id}/payments/${payment.id}/refunds`)
      .send({ refundedOn: '2026-06-10', ...data })
      .auth(token, { type: 'bearer' });

  describe('references', () => {
    it('numbers registrations per event after the event code', async () => {
      const { event, registration } = await setup();
      const second = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
      });
      const finance = await prisma.eventFinance.findUniqueOrThrow({
        where: { eventId: event.id },
      });

      expect(finance.referenceCode).toMatch(/^[2-9A-HJ-NP-Z]{4}$/);
      expect([registration.paymentReference, second.paymentReference]).toEqual([
        `${finance.referenceCode}-0001`,
        `${finance.referenceCode}-0002`,
      ]);
    });
  });

  describe('fees view', () => {
    it('shows the projection only, never the answers', async () => {
      const { event, token, registration } = await setup();

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/payments/registrations`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      const fees = body.data as RegistrationFee[];
      expect(fees).toHaveLength(1);
      expect(fees[0]).toMatchObject({
        id: registration.id,
        reference: registration.paymentReference,
        balance: { status: 'UNPAID', amountDue: 20000, outstanding: 20000 },
      });
      expect(JSON.stringify(body)).not.toContain('never in the fees view');
    });

    it('opens to a treasurer, who still sees no registration', async () => {
      const { event } = await setup();
      const token = await addManager(event, 'TREASURER');

      await request()
        .get(`/api/v1/events/${event.id}/payments/registrations`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(token, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('recording', () => {
    it.each([
      { role: 'DIRECTOR', status: 201 },
      { role: 'TREASURER', status: 201 },
      { role: 'COORDINATOR', status: 201 },
      { role: 'VIEWER', status: 403 },
      { role: 'COUNSELOR', status: 403 },
    ])('lets $role record a payment: $status', async ({ role, status }) => {
      const { event, registration } = await setup();
      const token = await addManager(event, role);

      await request()
        .post(feeUrl(event, registration))
        .send({ amount: 5000, method: 'CASH', paidOn: '2026-06-01' })
        .auth(token, { type: 'bearer' })
        .expect(status);
    });

    it('moves the balance from partial to paid to overpaid', async () => {
      const { event, token, registration } = await setup();

      expect((await pay(event, registration, token, 5000)).balance.status).toBe(
        'PARTIAL',
      );
      expect(
        (await pay(event, registration, token, 15000)).balance.status,
      ).toBe('PAID');
      const fee = await pay(event, registration, token, 3000);
      expect(fee.balance).toMatchObject({ status: 'OVERPAID', overpaid: 3000 });
    });

    it('keeps a snapshot of who paid', async () => {
      const { event, token, registration } = await setup();

      const fee = await pay(event, registration, token, 5000);

      expect(fee.payments[0]).toMatchObject({
        payerName: `${registration.firstName} ${registration.lastName}`,
        registrationRef: registration.id,
        currency: 'EUR',
      });
    });
  });

  describe('refunds', () => {
    it('refuses more than is left of the payment', async () => {
      const { event, token, registration } = await setup();
      const [payment] = (await pay(event, registration, token, 5000)).payments;

      await refund(event, payment!, token, { amount: 6000 }).expect(409);
    });

    it('gives back an excess without lowering the amount due', async () => {
      const { event, token, registration } = await setup();
      const [payment] = (await pay(event, registration, token, 23000)).payments;

      await refund(event, payment!, token, {
        amount: 3000,
        reduceAmountDue: true,
      }).expect(201);

      const fee = await request()
        .get(feeUrl(event, registration))
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(fee.body.data.balance).toMatchObject({
        status: 'PAID',
        amountDue: 20000,
      });
    });

    it('takes a cancellation off the amount due until it is deleted', async () => {
      const { event, token, registration } = await setup();
      const [payment] = (await pay(event, registration, token, 20000)).payments;

      const { body } = await refund(event, payment!, token, {
        amount: 20000,
        reduceAmountDue: true,
      }).expect(201);
      const refunded = body.data as Payment;
      expect(refunded.refunds[0]?.amountDueReduction).toBe(20000);

      const after = await request()
        .get(feeUrl(event, registration))
        .auth(token, { type: 'bearer' });
      expect(after.body.data.balance.status).toBe('REFUNDED');

      await request()
        .delete(
          `/api/v1/events/${event.id}/payments/${payment!.id}/refunds/${refunded.refunds[0]!.id}`,
        )
        .auth(token, { type: 'bearer' })
        .expect(200);
      const restored = await request()
        .get(feeUrl(event, registration))
        .auth(token, { type: 'bearer' });
      expect(restored.body.data.balance).toMatchObject({
        status: 'PAID',
        amountDue: 20000,
      });
    });

    it('is not for coordinators', async () => {
      const { event, token, registration } = await setup();
      const [payment] = (await pay(event, registration, token, 5000)).payments;
      const coordinator = await addManager(event, 'COORDINATOR');

      await refund(event, payment!, coordinator, { amount: 1000 }).expect(403);
    });
  });

  describe('amount due', () => {
    it('is set by hand and reset to the quote', async () => {
      const { event, token, registration } = await setup();
      const url = `${feeUrl(event, registration)}/amount-due`;

      const set = await request()
        .put(url)
        .send({ amount: 15000, note: 'Sibling discount' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(set.body.data.amountDue).toMatchObject({
        quotedAmount: 20000,
        override: 15000,
        note: 'Sibling discount',
      });
      expect(set.body.data.balance.amountDue).toBe(15000);

      const reset = await request()
        .put(url)
        .send({ amount: null })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(reset.body.data.amountDue).toMatchObject({
        override: null,
        note: null,
        adjustedAt: null,
      });
      expect(reset.body.data.balance.amountDue).toBe(20000);
    });
  });

  describe('deleting registrations', () => {
    const deleteUrl = (event: Event, registration: Registration) =>
      `/api/v1/events/${event.id}/registrations/${registration.id}?suppressMessage=true`;

    it('needs a settlement while it holds money', async () => {
      const { event, token, registration } = await setup();
      await pay(event, registration, token, 5000);

      const { body } = await request()
        .delete(deleteUrl(event, registration))
        .auth(token, { type: 'bearer' })
        .expect(409);
      expect(body).toHaveProperty('errorCode', 'PAYMENT_SETTLEMENT_REQUIRED');
    });

    it('lets only those who refund settle', async () => {
      const { event, token, registration } = await setup();
      await pay(event, registration, token, 5000);
      const coordinator = await addManager(event, 'COORDINATOR');

      await request()
        .delete(`${deleteUrl(event, registration)}&settlement=RETAINED`)
        .auth(coordinator, { type: 'bearer' })
        .expect(403);
    });

    it('keeps the payments, settled, as the accounting record', async () => {
      const { event, token, registration } = await setup();
      await pay(event, registration, token, 5000);

      await request()
        .delete(`${deleteUrl(event, registration)}&settlement=RETAINED`)
        .auth(token, { type: 'bearer' })
        .expect(204);

      const fees = await request()
        .get(`/api/v1/events/${event.id}/payments/registrations`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(fees.body.data).toHaveLength(0);
      const { body } = await request()
        .get(`/api/v1/events/${event.id}/payments/orphaned`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(body.data).toMatchObject([
        {
          registrationId: null,
          registrationRef: registration.id,
          settlement: 'RETAINED',
          amount: 5000,
        },
      ]);
    });

    it('deletes one without money without asking', async () => {
      const { event, token, registration } = await setup();

      await request()
        .delete(deleteUrl(event, registration))
        .auth(token, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('retention', () => {
    it('clears payer names of deleted registrations after ten years', async () => {
      const { event, token, registration } = await setup();
      const [payment] = (await pay(event, registration, token, 5000)).payments;
      await prisma.registration.delete({ where: { id: registration.id } });

      const service = resolve(PaymentService);
      // Paid 2026-06-01: kept through 2036.
      expect(await service.clearExpiredPayerNames(new Date('2036-12-31'))).toBe(
        0,
      );
      expect(await service.clearExpiredPayerNames(new Date('2037-01-01'))).toBe(
        1,
      );

      const cleared = await prisma.payment.findUniqueOrThrow({
        where: { id: payment!.id },
      });
      expect(cleared).toMatchObject({ payerName: null, amount: 5000 });
    });
  });

  it('goes with its event', async () => {
    const { event, token, registration } = await setup();
    await pay(event, registration, token, 5000);

    await prisma.event.delete({ where: { id: event.id } });

    expect(await prisma.payment.count({ where: { eventId: event.id } })).toBe(
      0,
    );
  });
});
