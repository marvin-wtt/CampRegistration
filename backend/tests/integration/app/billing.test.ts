import { describe, expect, it } from 'vitest';
import moment from 'moment';
import {
  EventFactory,
  FileFactory,
  OrganizationFactory,
  PriceModelFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { uploadFile } from './utils/file.js';
import { expectEmailCount, expectEmailTo } from '../utils/mail.js';
import crypto from 'crypto';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { resolve } from '#core/ioc/container';
import { BillingService } from '#app/billing/billing.service';
import { EventService } from '#app/event/event.service';
import { eventCreateNational } from './fixtures/event.fixtures.js';
import {
  BILLING_TIME_ZONE,
  billedRegistrationCount,
} from '#app/billing/billing.utils';
import { addMonths, monthOf } from '#utils/date';
import type { Prisma } from '#generated/prisma/client.js';

const billing = () => resolve(BillingService);

const adminToken = async () =>
  generateAccessToken(await UserFactory.create({ role: 'ADMIN' }));

/**
 * An event in UTC, so its stored wall-clock digits are the real instant and
 * "started"/"ended" can be set up relative to now.
 */
async function eventRunning(
  data: Partial<Prisma.EventCreateInput> = {},
  { startedHoursAgo = 1, endsInHours = 24 } = {},
) {
  return EventFactory.create({
    timezone: 'UTC',
    startAt: moment().subtract(startedHoursAgo, 'hours').toDate(),
    endAt: moment().add(endsInHours, 'hours').toDate(),
    ...data,
  });
}

async function register(
  eventId: string,
  status: 'ACCEPTED' | 'PENDING' | 'WAITLISTED' = 'ACCEPTED',
) {
  return RegistrationFactory.create({
    event: { connect: { id: eventId } },
    status,
  });
}

async function endEvent(eventId: string) {
  await prisma.event.update({
    where: { id: eventId },
    data: { endAt: moment().subtract(1, 'minute').toDate() },
  });
}

async function directorToken(eventId: string) {
  const user = await UserFactory.create();
  await prisma.eventManager.create({
    data: { eventId, userId: user.id, role: 'DIRECTOR' },
  });

  return generateAccessToken(user);
}

/** The event's newest bill. */
const bill = (eventId: string) =>
  prisma.eventBill.findFirstOrThrow({
    where: { eventId },
    orderBy: { id: 'desc' },
  });

/** A finalized OPEN bill for an ended event, priced at `price` per registration. */
async function openBill(price = 3, registrations = 1) {
  const priceModel = await PriceModelFactory.create({
    pricePerRegistration: price,
  });
  const event = await eventRunning({
    priceModel: { connect: { id: priceModel.id } },
  });
  for (let i = 0; i < registrations; i++) {
    await register(event.id);
  }
  await billing().openDraftsForStartedEvents();
  await endEvent(event.id);
  await billing().finalizeEndedEvents();

  return { event, bill: await bill(event.id) };
}

describe('event billing', () => {
  describe('opening drafts', () => {
    it('opens a DRAFT for a started event, seeded with its accepted registrations', async () => {
      const event = await eventRunning();
      await register(event.id);
      await register(event.id);
      await register(event.id, 'PENDING');
      await register(event.id, 'WAITLISTED');

      await billing().openDraftsForStartedEvents();

      const draft = await bill(event.id);
      expect(draft.status).toBe('DRAFT');
      expect(billedRegistrationCount(draft)).toBe(2);
      expect(draft.organizationId).toBe(event.organizationId);
    });

    it('does not open a bill before the event starts', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().add(1, 'hour').toDate(),
        endAt: moment().add(2, 'days').toDate(),
      });

      await billing().openDraftsForStartedEvents();

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(0);
    });

    it('never bills events that ended before billing existed', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().subtract(10, 'days').toDate(),
        endAt: moment().subtract(3, 'days').toDate(),
      });

      await billing().openDraftsForStartedEvents();

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(0);
    });

    it('respects the event timezone', async () => {
      // Wall-clock "now" in Tokyo (UTC+9) is 9 hours ahead: digits one hour
      // before Tokyo's current time have started, even though as UTC digits
      // they lie in the future.
      const tokyoNow = moment().utc().add(9, 'hours');
      const event = await EventFactory.create({
        timezone: 'Asia/Tokyo',
        startAt: tokyoNow.clone().subtract(1, 'hour').toDate(),
        endAt: tokyoNow.clone().add(1, 'day').toDate(),
      });

      await billing().openDraftsForStartedEvents();

      expect((await bill(event.id)).status).toBe('DRAFT');
    });

    it('is idempotent', async () => {
      const event = await eventRunning();

      await billing().openDraftsForStartedEvents();
      await billing().openDraftsForStartedEvents();

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(1);
    });

    it('opens one draft when two instances run at once', async () => {
      const event = await eventRunning();

      await Promise.all([
        billing().openDraftsForStartedEvents(),
        billing().openDraftsForStartedEvents(),
      ]);

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(1);
    });
  });

  describe('counting at start and end', () => {
    async function finalize(eventId: string) {
      await endEvent(eventId);
      await billing().finalizeEndedEvents();

      return bill(eventId);
    }

    it('bills the start count when registrations are deleted during the event', async () => {
      const event = await eventRunning();
      const first = await register(event.id);
      await register(event.id);
      await billing().openDraftsForStartedEvents();

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${first.id}`)
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(204);

      const finalized = await finalize(event.id);
      expect(finalized.startRegistrationCount).toBe(2);
      expect(finalized.endRegistrationCount).toBe(1);
      expect(billedRegistrationCount(finalized)).toBe(2);
    });

    it('bills the end count when registrations are accepted during the event', async () => {
      const event = await eventRunning();
      await register(event.id);
      const pending = await register(event.id, 'PENDING');
      await billing().openDraftsForStartedEvents();

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${pending.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(200);

      const finalized = await finalize(event.id);
      expect(finalized.startRegistrationCount).toBe(1);
      expect(finalized.endRegistrationCount).toBe(2);
      expect(billedRegistrationCount(finalized)).toBe(2);
    });

    it('bills a replacement once', async () => {
      const event = await eventRunning();
      const token = await directorToken(event.id);
      const first = await register(event.id);
      const replacement = await register(event.id, 'WAITLISTED');
      await billing().openDraftsForStartedEvents();

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${first.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204);
      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${replacement.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(billedRegistrationCount(await finalize(event.id))).toBe(1);
    });

    it('does not count waitlisted or pending registrations', async () => {
      const event = await eventRunning();
      await register(event.id, 'PENDING');
      await register(event.id, 'WAITLISTED');
      await billing().openDraftsForStartedEvents();

      expect(billedRegistrationCount(await finalize(event.id))).toBe(0);
    });

    it('does not change a finalized bill', async () => {
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();
      await finalize(event.id);
      await register(event.id);

      await billing().finalizeEndedEvents();

      expect(billedRegistrationCount(await bill(event.id))).toBe(0);
    });
  });

  describe('finalizing', () => {
    it("prices the count with the organization's model", async () => {
      const priceModel = await PriceModelFactory.create({
        currency: 'EUR',
        pricePerRegistration: 2,
        baseFee: 10,
        taxRate: 19,
      });
      const organization = await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });
      const event = await eventRunning({
        organization: { connect: { id: organization.id } },
      });
      await register(event.id);
      await register(event.id);
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      await endEvent(event.id);

      await billing().finalizeEndedEvents();

      const finalized = await bill(event.id);
      expect(finalized.status).toBe('OPEN');
      expect(billedRegistrationCount(finalized)).toBe(3);
      expect(finalized.priceModelId).toBe(priceModel.id);
      expect(finalized.currency).toBe('EUR');
      expect(finalized.netAmount?.toFixed(2)).toBe('16.00');
      expect(finalized.taxAmount?.toFixed(2)).toBe('3.04');
      expect(finalized.grossAmount?.toFixed(2)).toBe('19.04');
      expect(finalized.finalizedAt).not.toBeNull();
    });

    it("lets an event override beat the organization's model", async () => {
      const override = await PriceModelFactory.create({
        pricePerRegistration: 0,
        baseFee: 0,
      });
      const event = await eventRunning({
        priceModel: { connect: { id: override.id } },
      });
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      await endEvent(event.id);

      await billing().finalizeEndedEvents();

      const finalized = await bill(event.id);
      expect(finalized.priceModelId).toBe(override.id);
      expect(finalized.grossAmount?.toFixed(2)).toBe('0.00');
    });

    it('settles a zero total as PAID', async () => {
      const event = await eventRunning();
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      await endEvent(event.id);

      await billing().finalizeEndedEvents();

      const finalized = await bill(event.id);
      expect(finalized.status).toBe('PAID');
      expect(finalized.paidAt).not.toBeNull();
    });

    it('keeps the snapshot when the model changes later', async () => {
      const priceModel = await PriceModelFactory.create({
        pricePerRegistration: 5,
      });
      const event = await eventRunning({
        priceModel: { connect: { id: priceModel.id } },
      });
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      await endEvent(event.id);
      await billing().finalizeEndedEvents();

      await prisma.priceModel.update({
        where: { id: priceModel.id },
        data: { pricePerRegistration: 50 },
      });
      await billing().finalizeEndedEvents();

      expect((await bill(event.id)).grossAmount?.toFixed(2)).toBe('5.00');
    });

    it('does not finalize a running event', async () => {
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();

      await billing().finalizeEndedEvents();

      expect((await bill(event.id)).status).toBe('DRAFT');
    });

    it('keeps the bill of a deleted event', async () => {
      const event = await eventRunning();
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      const { id } = await bill(event.id);

      await prisma.event.delete({ where: { id: event.id } });

      const orphan = await prisma.eventBill.findUniqueOrThrow({
        where: { id },
      });
      expect(orphan.eventId).toBeNull();
      expect(orphan.startRegistrationCount).toBe(1);
    });

    it("prices a deleted event's bill with the event's model", async () => {
      const override = await PriceModelFactory.create({
        pricePerRegistration: 1,
      });
      const event = await eventRunning({
        priceModel: { connect: { id: override.id } },
      });
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      const { id } = await bill(event.id);

      await resolve(EventService).deleteEventById(event.id);
      await prisma.eventBill.update({
        where: { id },
        data: { eventEndAt: moment().subtract(1, 'minute').toDate() },
      });
      await billing().finalizeEndedEvents();

      const finalized = await prisma.eventBill.findUniqueOrThrow({
        where: { id },
      });
      expect(finalized.priceModelId).toBe(override.id);
      expect(finalized.grossAmount?.toFixed(2)).toBe('1.00');
    });
  });

  describe('moving event dates', () => {
    /** Naive local digits for an event in UTC, `hours` from now. */
    const at = (hours: number) =>
      moment().utc().add(hours, 'hours').format('YYYY-MM-DDTHH:mm:ss');

    const moveEvent = async (
      eventId: string,
      startInHours: number,
      endInHours: number,
    ) =>
      request()
        .patch(`/api/v1/events/${eventId}`)
        .send({ startAt: at(startInHours), endAt: at(endInHours) })
        .auth(await directorToken(eventId), { type: 'bearer' });

    it('discards a running bill when the event is postponed', async () => {
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();
      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(1);

      expect((await moveEvent(event.id, 24 * 10, 24 * 12)).status).toBe(200);

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(0);
    });

    it('keeps a running bill when only the end moves later', async () => {
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();

      expect((await moveEvent(event.id, -1, 24 * 5)).status).toBe(200);

      expect((await bill(event.id)).status).toBe('DRAFT');
    });

    it('refuses to move a billed event into the future', async () => {
      const { event } = await openBill();
      const before = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });

      const response = await moveEvent(event.id, 24 * 300, 24 * 302);

      expect(response.status).toBe(409);
      expect(response.body.errorCode).toBe('EVENT_ALREADY_BILLED');
      const unchanged = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(unchanged.endAt).toEqual(before.endAt);
    });

    it('lets a billed event be corrected within the past', async () => {
      const { event } = await openBill();

      expect((await moveEvent(event.id, -48, -24)).status).toBe(200);
    });

    it('bills a voided event again once it is rescheduled', async () => {
      const token = await adminToken();
      const { event, bill: voided } = await openBill();
      await request()
        .patch(`/api/v1/bills/${voided.id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect((await moveEvent(event.id, -1, 24)).status).toBe(200);
      await billing().openDraftsForStartedEvents();

      const replacement = await bill(event.id);
      expect(replacement).toMatchObject({
        status: 'DRAFT',
        sequence: 1,
        replacesBillId: voided.id,
      });
    });

    it('bills an event moved into the recent past at once', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().add(30, 'days').toDate(),
        endAt: moment().add(32, 'days').toDate(),
      });
      await register(event.id);

      expect((await moveEvent(event.id, -24 * 3, -24 * 2)).status).toBe(200);

      const billed = await bill(event.id);
      expect(billed.finalizedAt).not.toBeNull();
      expect(billed.startRegistrationCount).toBe(1);
    });

    it('refuses to move an event far into the past', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().add(30, 'days').toDate(),
        endAt: moment().add(32, 'days').toDate(),
      });
      await register(event.id);

      const response = await moveEvent(event.id, -24 * 90, -24 * 88);

      expect(response.status).toBe(409);
      expect(response.body.errorCode).toBe('EVENT_DATES_OUT_OF_RANGE');
      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(0);
    });

    it('lets an event long past be corrected without billing it', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().subtract(90, 'days').toDate(),
        endAt: moment().subtract(88, 'days').toDate(),
      });
      await register(event.id);

      expect((await moveEvent(event.id, -24 * 91, -24 * 89)).status).toBe(200);

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(0);
    });
  });

  describe('GET /api/v1/organizations/:organizationId/billing', () => {
    it.each([
      { role: 'ADMIN', expectedStatus: 200 },
      { role: 'MEMBER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` for an organization $role',
      async ({ role, expectedStatus }) => {
        const user = await UserFactory.create();
        const organization = await OrganizationFactory.create({
          members: { create: { userId: user.id, role } },
        });

        await request()
          .get(`/api/v1/organizations/${organization.id}/billing`)
          .auth(generateAccessToken(user), { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it("should respond with `403` for another organization's admin", async () => {
      const user = await UserFactory.create();
      await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      const other = await OrganizationFactory.create();

      await request()
        .get(`/api/v1/organizations/${other.id}/billing`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
    });

    it('should list the price model and the bills', async () => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      await eventRunning({
        organization: { connect: { id: organization.id } },
      });
      await billing().openDraftsForStartedEvents();

      const { body } = await request()
        .get(`/api/v1/organizations/${organization.id}/billing`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      expect(body.data.priceModel.id).toBe(organization.priceModelId);
      expect(body.data.bills).toHaveLength(1);
      expect(body.data.bills[0].status).toBe('DRAFT');
    });
  });

  describe('administration', () => {
    it('lets only system administrators list price models', async () => {
      const user = await UserFactory.create();

      await request()
        .get('/api/v1/price-models')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
      await request()
        .get('/api/v1/price-models')
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);
    });

    it('creates a price model with money as strings', async () => {
      const { body } = await request()
        .post('/api/v1/price-models')
        .send({
          name: 'Standard',
          pricePerRegistration: 2.5,
          baseFee: 10,
          taxRate: 19,
        })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        name: 'Standard',
        currency: 'EUR',
        pricePerRegistration: '2.50',
        baseFee: '10.00',
        taxRate: '19.00',
        isDefault: false,
      });
    });

    it('moves the default to another model', async () => {
      const token = await adminToken();
      const first = await PriceModelFactory.create({ isDefault: true });
      const second = await PriceModelFactory.create();

      await request()
        .put(`/api/v1/price-models/${second.id}/default`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      const models = await prisma.priceModel.findMany({
        where: { id: { in: [first.id, second.id] } },
      });
      expect(models.find((m) => m.id === first.id)?.isDefault).toBeNull();
      expect(models.find((m) => m.id === second.id)?.isDefault).toBe(true);
    });

    it('starts a new organization on the default model', async () => {
      const priceModel = await PriceModelFactory.create({ isDefault: true });
      const user = await UserFactory.create();

      const { body } = await request()
        .post('/api/v1/organizations')
        .send({
          name: 'Youth Adventures',
          contactEmail: 'contact@example.com',
          country: 'de',
          addressStreet: 'Example Street 1',
          addressZipCode: '10115',
          addressCity: 'Berlin',
          acceptedPriceModelId: priceModel.id,
        })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(201);

      expect(body.data.priceModelId).toBe(priceModel.id);
      // The founder's agreement, recorded as an accepted offer.
      const agreement = await prisma.priceModelOffer.findFirstOrThrow({
        where: { organizationId: body.data.id },
      });
      expect(agreement).toMatchObject({
        priceModelId: priceModel.id,
        acceptedByUserId: user.id,
      });
      expect(agreement.acceptedAt).not.toBeNull();
    });

    it('refuses a new organization agreeing to a model that is no longer the default', async () => {
      const outdated = await PriceModelFactory.create();
      await PriceModelFactory.create({ isDefault: true });

      const { body } = await request()
        .post('/api/v1/organizations')
        .send({
          name: 'Youth Adventures',
          contactEmail: 'contact@example.com',
          country: 'de',
          addressStreet: 'Example Street 1',
          addressZipCode: '10115',
          addressCity: 'Berlin',
          acceptedPriceModelId: outdated.id,
        })
        .auth(generateAccessToken(await UserFactory.create()), {
          type: 'bearer',
        })
        .expect(409);

      expect(body.errorCode).toBe('PRICE_MODEL_CHANGED');
    });

    it('recreates the free default when none exists', async () => {
      await prisma.priceModel.updateMany({ data: { isDefault: null } });
      const user = await UserFactory.create();
      const { body: shown } = await request()
        .get('/api/v1/price-models/default')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .post('/api/v1/organizations')
        .send({
          name: 'Youth Adventures',
          contactEmail: 'contact@example.com',
          country: 'de',
          addressStreet: 'Example Street 1',
          addressZipCode: '10115',
          addressCity: 'Berlin',
          acceptedPriceModelId: shown.data.id,
        })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(201);

      const priceModel = await prisma.priceModel.findUniqueOrThrow({
        where: { id: body.data.priceModelId },
      });
      expect(priceModel.isDefault).toBe(true);
      expect(priceModel.pricePerRegistration.isZero()).toBe(true);
    });

    it('refuses to delete a price model in use', async () => {
      const priceModel = await PriceModelFactory.create();
      await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });

      await request()
        .delete(`/api/v1/price-models/${priceModel.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('deletes an unused price model', async () => {
      const priceModel = await PriceModelFactory.create();

      await request()
        .delete(`/api/v1/price-models/${priceModel.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(204);
    });

    it('assigns a model to an organization and an event', async () => {
      const token = await adminToken();
      const priceModel = await PriceModelFactory.create();
      const event = await EventFactory.create();

      await request()
        .put(`/api/v1/organizations/${event.organizationId}/price-model`)
        .send({ priceModelId: priceModel.id })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .put(`/api/v1/events/${event.id}/price-model`)
        .send({ priceModelId: priceModel.id })
        .auth(token, { type: 'bearer' })
        .expect(200);

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: event.organizationId },
      });
      const updated = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(organization.priceModelId).toBe(priceModel.id);
      expect(updated.priceModelId).toBe(priceModel.id);
    });

    it('refuses to assign an archived model', async () => {
      const priceModel = await PriceModelFactory.create({
        archivedAt: new Date(),
      });
      const organization = await OrganizationFactory.create();

      await request()
        .put(`/api/v1/organizations/${organization.id}/price-model`)
        .send({ priceModelId: priceModel.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('does not let an organization admin assign a model', async () => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      const priceModel = await PriceModelFactory.create();

      await request()
        .put(`/api/v1/organizations/${organization.id}/price-model`)
        .send({ priceModelId: priceModel.id })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
    });

    it('marks an open bill as paid, and refuses to reopen a void one', async () => {
      const token = await adminToken();
      const priceModel = await PriceModelFactory.create({
        pricePerRegistration: 3,
      });
      const event = await eventRunning({
        priceModel: { connect: { id: priceModel.id } },
      });
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      await endEvent(event.id);
      await billing().finalizeEndedEvents();
      const { id } = await bill(event.id);

      const { body } = await request()
        .patch(`/api/v1/bills/${id}`)
        .send({ status: 'PAID', note: 'Bank transfer' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(body.data.status).toBe('PAID');
      expect(body.data.paidAt).not.toBeNull();

      await request()
        .patch(`/api/v1/bills/${id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .patch(`/api/v1/bills/${id}`)
        .send({ status: 'PAID' })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });

    it('corrects the count of an open bill and re-prices it', async () => {
      const { bill: open } = await openBill(3, 2);

      const { body } = await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ adjustedRegistrationCount: 5, note: 'Two unregistered guests' })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        startRegistrationCount: 2,
        endRegistrationCount: 2,
        adjustedRegistrationCount: 5,
        registrationCount: 5,
        grossAmount: '15.00',
      });
    });

    it('removes a correction again', async () => {
      const token = await adminToken();
      const { bill: open } = await openBill(3, 2);
      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ adjustedRegistrationCount: 5 })
        .auth(token, { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ adjustedRegistrationCount: null })
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrationCount).toBe(2);
      expect(body.data.grossAmount).toBe('6.00');
    });

    it('refuses to correct a paid bill', async () => {
      const token = await adminToken();
      const { bill: open } = await openBill();
      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ status: 'PAID' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ adjustedRegistrationCount: 9 })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });

    it('bills a voided bill again with another price model', async () => {
      const token = await adminToken();
      const { event, bill: open } = await openBill(3, 2);
      const cheaper = await PriceModelFactory.create({
        pricePerRegistration: 1,
      });
      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id, priceModelId: cheaper.id })
        .auth(token, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        eventId: event.id,
        status: 'OPEN',
        replacesBillId: open.id,
        priceModelId: cheaper.id,
        registrationCount: 2,
        grossAmount: '2.00',
      });
      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(2);
    });

    it('bills a voided bill only once', async () => {
      const token = await adminToken();
      const { bill: open } = await openBill();
      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id })
        .auth(token, { type: 'bearer' })
        .expect(201);

      await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });

    it('refuses to bill again a bill that is not voided', async () => {
      const { bill: open } = await openBill();

      await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('bills an ended event that never got a bill', async () => {
      const event = await EventFactory.create({
        timezone: 'UTC',
        startAt: moment().subtract(10, 'days').toDate(),
        endAt: moment().subtract(3, 'days').toDate(),
      });
      await register(event.id);
      await register(event.id);

      const { body } = await request()
        .post('/api/v1/bills')
        .send({ eventId: event.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        eventId: event.id,
        startRegistrationCount: 2,
        endRegistrationCount: 2,
        registrationCount: 2,
      });
    });

    it('refuses to bill an event that has not ended', async () => {
      const event = await eventRunning();

      await request()
        .post('/api/v1/bills')
        .send({ eventId: event.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('refuses a second live bill for an event', async () => {
      const { event } = await openBill();

      await request()
        .post('/api/v1/bills')
        .send({ eventId: event.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('bills a billed event again only through its voided bill', async () => {
      const token = await adminToken();
      const { event, bill: open } = await openBill();
      await request()
        .patch(`/api/v1/bills/${open.id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      await request()
        .post('/api/v1/bills')
        .send({ eventId: event.id })
        .auth(token, { type: 'bearer' })
        .expect(409);
      const { body } = await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id })
        .auth(token, { type: 'bearer' })
        .expect(201);

      const replacement = await prisma.eventBill.findUniqueOrThrow({
        where: { id: body.data.id },
      });
      expect(open.sequence).toBe(0);
      expect(replacement.sequence).toBe(1);
    });

    it('does not reopen a draft for an event whose bill was voided', async () => {
      const token = await adminToken();
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();
      const draft = await bill(event.id);
      await prisma.eventBill.update({
        where: { id: draft.id },
        data: { status: 'VOID' },
      });

      await billing().openDraftsForStartedEvents();

      expect(
        await prisma.eventBill.count({ where: { eventId: event.id } }),
      ).toBe(1);
      await request()
        .get('/api/v1/bills?status=VOID')
        .auth(token, { type: 'bearer' })
        .expect(200);
    });

    it('lists billing on the admin overview', async () => {
      await openBill(3, 2);

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      expect(body.data.billing).toEqual({
        draft: 0,
        open: 1,
        outstanding: [{ currency: 'EUR', amount: '6.00' }],
      });
    });

    it('lets only system administrators bill by hand', async () => {
      const { bill: open } = await openBill();

      await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: open.id })
        .auth(generateAccessToken(await UserFactory.create()), {
          type: 'bearer',
        })
        .expect(403);
    });

    it("shows an event's price model in the admin listing only", async () => {
      const priceModel = await PriceModelFactory.create();
      const event = await EventFactory.create({
        listed: true,
        priceModel: { connect: { id: priceModel.id } },
      });

      const { body: admin } = await request()
        .get('/api/v1/events?view=all')
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);
      const { body: listed } = await request()
        .get('/api/v1/events')
        .expect(200);

      expect(
        admin.data.find((row: { id: string }) => row.id === event.id),
      ).toMatchObject({
        priceModel: { id: priceModel.id },
        isPriceModelOverride: true,
      });
      for (const row of listed.data) {
        expect(row).not.toHaveProperty('priceModel');
      }
    });

    it("pins a new event to its organization's price model", async () => {
      const priceModel = await PriceModelFactory.create();
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });

      const { body } = await request()
        .post('/api/v1/events')
        .send({ ...eventCreateNational, organizationId: organization.id })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(201);

      const event = await prisma.event.findUniqueOrThrow({
        where: { id: body.data.id },
      });
      expect(event.priceModelId).toBe(priceModel.id);
    });

    it("keeps an event's model when its organization moves to another", async () => {
      const event = await eventRunning();
      const pinned = event.priceModelId;
      const other = await PriceModelFactory.create();

      await request()
        .put(`/api/v1/organizations/${event.organizationId}/price-model`)
        .send({ priceModelId: other.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      const after = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(after.priceModelId).toBe(pinned);
    });

    it('leaves existing events on their model when the organization moves', async () => {
      const previous = await PriceModelFactory.create();
      const next = await PriceModelFactory.create();
      const organization = await OrganizationFactory.create({
        priceModel: { connect: { id: previous.id } },
      });
      const upcoming = await EventFactory.create({
        organization: { connect: { id: organization.id } },
        priceModel: { connect: { id: previous.id } },
        timezone: 'UTC',
        startAt: moment().add(10, 'days').toDate(),
        endAt: moment().add(12, 'days').toDate(),
      });

      await request()
        .put(`/api/v1/organizations/${organization.id}/price-model`)
        .send({ priceModelId: next.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      const event = await prisma.event.findUniqueOrThrow({
        where: { id: upcoming.id },
      });
      expect(event.priceModelId).toBe(previous.id);
    });

    it('refuses to change the prices of a price model in use', async () => {
      const priceModel = await PriceModelFactory.create({
        pricePerRegistration: 2,
      });
      await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });

      await request()
        .patch(`/api/v1/price-models/${priceModel.id}`)
        .send({ pricePerRegistration: 3 })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('renames a price model in use, and accepts unchanged prices', async () => {
      const priceModel = await PriceModelFactory.create({
        pricePerRegistration: 2,
      });
      await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });

      const { body } = await request()
        .patch(`/api/v1/price-models/${priceModel.id}`)
        .send({ name: 'Renamed', pricePerRegistration: 2 })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      expect(body.data.name).toBe('Renamed');
    });

    it('changes the prices of an unused price model', async () => {
      const priceModel = await PriceModelFactory.create({
        pricePerRegistration: 2,
      });

      const { body } = await request()
        .patch(`/api/v1/price-models/${priceModel.id}`)
        .send({ pricePerRegistration: 3 })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      expect(body.data.pricePerRegistration).toBe('3.00');
    });

    it("moves an event to its new owner's model when it was on the old owner's", async () => {
      const ownModel = await PriceModelFactory.create();
      const targetModel = await PriceModelFactory.create();
      const source = await OrganizationFactory.create({
        priceModel: { connect: { id: ownModel.id } },
      });
      const target = await OrganizationFactory.create({
        priceModel: { connect: { id: targetModel.id } },
      });
      const event = await EventFactory.create({
        organization: { connect: { id: source.id } },
      });

      await resolve(EventService).moveEventToOrganization(event.id, target.id);

      const moved = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(moved.priceModelId).toBe(targetModel.id);
    });

    it('hands a running bill to the new owner of a moved event', async () => {
      const event = await eventRunning();
      await register(event.id);
      await billing().openDraftsForStartedEvents();
      const target = await OrganizationFactory.create();

      await resolve(EventService).moveEventToOrganization(event.id, target.id);

      expect((await bill(event.id)).organizationId).toBe(target.id);
    });

    it('marks an event as an override once its organization changed model', async () => {
      const event = await eventRunning();
      const next = await PriceModelFactory.create();
      await prisma.organization.update({
        where: { id: event.organizationId },
        data: { priceModelId: next.id },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/billing`)
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(200);

      // It keeps the model it was created with.
      expect(body.data).toMatchObject({
        priceModel: { id: event.priceModelId },
        isOverride: true,
      });
    });

    it('counts where each price model is used', async () => {
      const priceModel = await PriceModelFactory.create();
      await OrganizationFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });
      await EventFactory.create({
        priceModel: { connect: { id: priceModel.id } },
      });

      const { body } = await request()
        .get('/api/v1/price-models')
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      expect(
        body.data.find((row: { id: string }) => row.id === priceModel.id),
      ).toMatchObject({ usage: { organizations: 1, events: 1 } });
    });

    it("shows each bill's price model, a DRAFT's being the one it will use", async () => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      const override = await PriceModelFactory.create();
      await eventRunning({
        organization: { connect: { id: organization.id } },
        priceModel: { connect: { id: override.id } },
      });
      await eventRunning({
        organization: { connect: { id: organization.id } },
      });
      await billing().openDraftsForStartedEvents();

      const { body } = await request()
        .get(`/api/v1/organizations/${organization.id}/billing`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      expect(body.data).not.toHaveProperty('eventOverrides');
      expect(
        body.data.bills.map(
          (row: { priceModel: { id: string } }) => row.priceModel.id,
        ),
      ).toEqual(
        expect.arrayContaining([override.id, organization.priceModelId]),
      );
    });

    it("shows a DIRECTOR the event's own price model", async () => {
      const override = await PriceModelFactory.create();
      const event = await eventRunning({
        priceModel: { connect: { id: override.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/billing`)
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        priceModel: { id: override.id },
        isOverride: true,
      });
    });

    it("falls back to the organization's price model for an event", async () => {
      const event = await eventRunning();
      const { priceModelId } = await prisma.organization.findUniqueOrThrow({
        where: { id: event.organizationId },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/billing`)
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        priceModel: { id: priceModelId },
        isOverride: false,
      });
    });

    it("shows an organization ADMIN its event's price model", async () => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      const event = await eventRunning({
        organization: { connect: { id: organization.id } },
      });
      await register(event.id);
      await register(event.id);
      await register(event.id, 'PENDING');

      // The admin cannot list registrations, so the estimate's count comes here.
      const { body } = await request()
        .get(`/api/v1/events/${event.id}/billing`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      expect(body.data.estimate.registrationCount).toBe(2);
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ] as const)(
      "should respond with `$expectedStatus` for an event's $role",
      async ({ role, expectedStatus }) => {
        const event = await eventRunning();
        const user = await UserFactory.create();
        await prisma.eventManager.create({
          data: { eventId: event.id, userId: user.id, role },
        });

        await request()
          .get(`/api/v1/events/${event.id}/billing`)
          .auth(generateAccessToken(user), { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('filters bills by status', async () => {
      const token = await adminToken();
      await eventRunning();
      await billing().openDraftsForStartedEvents();

      const { body } = await request()
        .get('/api/v1/bills?status=DRAFT')
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].organization.id).toBeDefined();
    });

    describe('monthly overview', () => {
      const thisMonth = () => monthOf(new Date(), BILLING_TIME_ZONE);

      it('sums the bills of this month', async () => {
        await openBill(3, 2);

        const { body } = await request()
          .get('/api/v1/bills/summary')
          .auth(await adminToken(), { type: 'bearer' })
          .expect(200);

        const year = Number(thisMonth().slice(0, 4));
        expect(body.data.year).toBe(year);
        expect(body.data.years).toEqual([year]);
        // Billing started this month, so it is the only one listed.
        expect(body.data.months).toHaveLength(1);
        expect(body.data.totals).toEqual([
          expect.objectContaining({ currency: 'EUR', grossAmount: '6.00' }),
        ]);
        expect(body.data.months[0]).toMatchObject({
          month: thisMonth(),
          currency: 'EUR',
          bills: 1,
          grossAmount: '6.00',
          openAmount: '6.00',
          receivedAmount: '0.00',
        });
      });

      it('filters the bill list by month', async () => {
        const token = await adminToken();
        const { bill: openedBill } = await openBill();

        const { body: current } = await request()
          .get('/api/v1/bills')
          .query({ month: thisMonth() })
          .auth(token, { type: 'bearer' })
          .expect(200);
        const { body: earlier } = await request()
          .get('/api/v1/bills')
          .query({ month: addMonths(thisMonth(), -1) })
          .auth(token, { type: 'bearer' })
          .expect(200);

        expect(current.data.map((bill: { id: string }) => bill.id)).toEqual([
          openedBill.id,
        ]);
        expect(earlier.data).toHaveLength(0);
      });

      it('exports the months as CSV', async () => {
        const { bill: openedBill } = await openBill(3, 2);

        const response = await request()
          .get('/api/v1/bills/export')
          .query({ from: thisMonth(), to: thisMonth() })
          .auth(await adminToken(), { type: 'bearer' })
          .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.headers['content-disposition']).toContain(
          `bills-${thisMonth()}_${thisMonth()}.csv`,
        );
        const [header, line] = response.text.split('\r\n');
        expect(header).toContain('invoice_date,bill_id');
        expect(line).toContain(openedBill.id);
        expect(line).toContain('6.00');
      });

      it('separates the export the way the locale expects', async () => {
        await openBill(3, 2);

        const response = await request()
          .get('/api/v1/bills/export')
          .query({ from: thisMonth(), to: thisMonth(), locale: 'de-DE' })
          .auth(await adminToken(), { type: 'bearer' })
          .expect(200);

        const [header, line] = response.text.split('\r\n');
        expect(header).toContain('invoice_date;bill_id');
        expect(line).toContain(';6,00;');
      });

      it('refuses an inverted export range', async () => {
        await request()
          .get('/api/v1/bills/export')
          .query({ from: thisMonth(), to: addMonths(thisMonth(), -1) })
          .auth(await adminToken(), { type: 'bearer' })
          .expect(400);
      });

      it('is for system administrators only', async () => {
        const token = generateAccessToken(await UserFactory.create());

        await request()
          .get('/api/v1/bills/summary')
          .auth(token, { type: 'bearer' })
          .expect(403);
        await request()
          .get('/api/v1/bills/export')
          .query({ from: thisMonth(), to: thisMonth() })
          .auth(token, { type: 'bearer' })
          .expect(403);
      });
    });

    it('refuses to delete an organization with an unpaid bill', async () => {
      const user = await UserFactory.create();
      const organization = await OrganizationFactory.create({
        members: { create: { userId: user.id, role: 'ADMIN' } },
      });
      const event = await eventRunning({
        organization: { connect: { id: organization.id } },
      });
      await billing().openDraftsForStartedEvents();
      await prisma.event.delete({ where: { id: event.id } });

      const { body } = await request()
        .delete(`/api/v1/organizations/${organization.id}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(409);

      expect(body.errorCode).toBe('ORGANIZATION_HAS_UNPAID_BILLS');
    });

    it('freezes the customer onto a finalized bill', async () => {
      const { bill: openedBill } = await openBill();
      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: openedBill.organizationId ?? '' },
      });

      expect(openedBill).toMatchObject({
        customerName: organization.name,
        customerAddressStreet: organization.addressStreet,
        customerAddressZipCode: organization.addressZipCode,
        customerAddressCity: organization.addressCity,
        customerCountry: organization.country,
        customerVatNumber: organization.vatNumber,
      });
    });

    it('deletes an organization whose bills are settled and keeps the bills', async () => {
      const user = await UserFactory.create();
      const { event, bill: openedBill } = await openBill();
      await prisma.organizationMember.create({
        data: {
          organizationId: event.organizationId,
          userId: user.id,
          role: 'ADMIN',
        },
      });
      await prisma.eventBill.update({
        where: { id: openedBill.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await prisma.event.delete({ where: { id: event.id } });

      await request()
        .delete(`/api/v1/organizations/${event.organizationId}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(204);

      const kept = await prisma.eventBill.findUniqueOrThrow({
        where: { id: openedBill.id },
      });
      expect(kept.organizationId).toBeNull();
      expect(kept.customerName).toBe(openedBill.customerName);

      const { body } = await request()
        .get('/api/v1/bills')
        .query({ search: openedBill.customerName })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);
      expect(body.data).toContainEqual(
        expect.objectContaining({
          id: openedBill.id,
          organization: null,
          customer: expect.objectContaining({ name: openedBill.customerName }),
        }),
      );
    });

    it('refuses to bill a deleted organization again', async () => {
      const token = await adminToken();
      const { bill: openedBill } = await openBill();
      await request()
        .patch(`/api/v1/bills/${openedBill.id}`)
        .send({ status: 'VOID' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await prisma.eventBill.update({
        where: { id: openedBill.id },
        data: { organizationId: null },
      });

      await request()
        .post('/api/v1/bills')
        .send({ replacesBillId: openedBill.id })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });
  });

  describe('invoices', () => {
    /** A PDF this session uploaded as a temporary file. */
    async function temporaryPdf(sessionId: string) {
      const name = crypto.randomUUID() + '.pdf';
      const file = await FileFactory.create({
        field: sessionId,
        name,
        accessLevel: 'private',
      });
      await uploadFile('blank.pdf', name);

      return file;
    }

    async function attachInvoice(
      billId: string,
      options: { status?: number; sessionId?: string; fileId?: string } = {},
    ) {
      const sessionId = options.sessionId ?? crypto.randomUUID();
      const fileId = options.fileId ?? (await temporaryPdf(sessionId)).id;

      return request()
        .post(`/api/v1/bills/${billId}/invoices`)
        .set('Cookie', ['session=' + sessionId, '__Host-session=' + sessionId])
        .auth(await adminToken(), { type: 'bearer' })
        .send({ fileId })
        .expect(options.status ?? 201);
    }

    async function organizationAdmin(organizationId: string | null) {
      if (!organizationId) {
        throw new Error('The bill has no organization');
      }
      const user = await UserFactory.create();
      await prisma.organizationMember.create({
        data: { organizationId, userId: user.id, role: 'ADMIN' },
      });

      return user;
    }

    it("attaches the PDF and emails the organization's admins", async () => {
      const { bill: openedBill } = await openBill();
      const admin = await organizationAdmin(openedBill.organizationId);

      const { body } = await attachInvoice(openedBill.id);

      expect(body.data).toMatchObject({ source: 'UPLOADED', type: 'INVOICE' });
      expectEmailTo(admin.email);

      const { body: billing } = await request()
        .get(`/api/v1/organizations/${openedBill.organizationId}/billing`)
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .expect(200);
      expect(billing.data.bills[0].invoices).toHaveLength(1);
    });

    it('does not email when nothing is owed', async () => {
      const { bill: openedBill } = await openBill();
      await organizationAdmin(openedBill.organizationId);
      await prisma.eventBill.update({
        where: { id: openedBill.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await attachInvoice(openedBill.id);

      expectEmailCount(0);
    });

    it('refuses an invoice for a running bill', async () => {
      const event = await eventRunning();
      await billing().openDraftsForStartedEvents();

      await attachInvoice((await bill(event.id)).id, { status: 409 });
    });

    it("refuses another session's upload", async () => {
      const { bill: openedBill } = await openBill();
      const file = await temporaryPdf(crypto.randomUUID());

      await attachInvoice(openedBill.id, { fileId: file.id, status: 400 });
    });

    it('refuses a file that is not a PDF', async () => {
      const { bill: openedBill } = await openBill();
      const sessionId = crypto.randomUUID();
      const file = await FileFactory.create({
        field: sessionId,
        type: 'image/png',
      });

      await attachInvoice(openedBill.id, {
        sessionId,
        fileId: file.id,
        status: 400,
      });
    });

    it('lets only system administrators attach invoices', async () => {
      const { bill: openedBill } = await openBill();
      const admin = await organizationAdmin(openedBill.organizationId);

      await request()
        .post(`/api/v1/bills/${openedBill.id}/invoices`)
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .send({ fileId: (await temporaryPdf(crypto.randomUUID())).id })
        .expect(403);
    });

    it('serves the PDF to the organization and the event director', async () => {
      const { event, bill: openedBill } = await openBill();
      const admin = await organizationAdmin(openedBill.organizationId);
      const { body } = await attachInvoice(openedBill.id);

      await request()
        .get(
          `/api/v1/organizations/${openedBill.organizationId}/billing/invoices/${body.data.id}`,
        )
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .expect(200)
        .expect('Content-Type', /application\/pdf/);

      await request()
        .get(`/api/v1/events/${event.id}/billing/invoices/${body.data.id}`)
        .auth(await directorToken(event.id), { type: 'bearer' })
        .expect(200);
    });

    it("hides an invoice behind another organization's route", async () => {
      const { bill: openedBill } = await openBill();
      const { body } = await attachInvoice(openedBill.id);
      const other = await OrganizationFactory.create();
      const otherAdmin = await organizationAdmin(other.id);

      await request()
        .get(
          `/api/v1/organizations/${other.id}/billing/invoices/${body.data.id}`,
        )
        .auth(generateAccessToken(otherAdmin), { type: 'bearer' })
        .expect(404);
    });

    it('refuses to correct an invoiced bill', async () => {
      const { bill: openedBill } = await openBill();
      await attachInvoice(openedBill.id);

      await request()
        .patch(`/api/v1/bills/${openedBill.id}`)
        .send({ adjustedRegistrationCount: 5 })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('refuses to move a billed event to another organization', async () => {
      const { event } = await openBill();
      const target = await OrganizationFactory.create();

      await expect(
        resolve(EventService).moveEventToOrganization(event.id, target.id),
      ).rejects.toMatchObject({ statusCode: 409 });

      const unmoved = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(unmoved.organizationId).toBe(event.organizationId);
    });

    it("hides a former owner's voided bill and invoice once the event moved", async () => {
      const { event, bill: openedBill } = await openBill();
      const { body } = await attachInvoice(openedBill.id);
      await prisma.eventBill.update({
        where: { id: openedBill.id },
        data: { status: 'VOID', voidedAt: new Date() },
      });
      const target = await OrganizationFactory.create();
      const targetAdmin = generateAccessToken(
        await organizationAdmin(target.id),
      );

      await resolve(EventService).moveEventToOrganization(event.id, target.id);

      const { body: billing } = await request()
        .get(`/api/v1/events/${event.id}/billing`)
        .auth(targetAdmin, { type: 'bearer' })
        .expect(200);
      expect(billing.data.bill).toBeNull();

      await request()
        .get(`/api/v1/events/${event.id}/billing/invoices/${body.data.id}`)
        .auth(targetAdmin, { type: 'bearer' })
        .expect(404);
    });

    it('refuses a second invoice for a bill', async () => {
      const { bill: openedBill } = await openBill();
      await attachInvoice(openedBill.id);

      await attachInvoice(openedBill.id, { status: 409 });
    });

    it('serves the PDF to administrators through the bill', async () => {
      const { bill: openedBill } = await openBill();
      const { body } = await attachInvoice(openedBill.id);

      await request()
        .get(`/api/v1/bills/${openedBill.id}/invoices/${body.data.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);
    });

    it('deletes an uploaded invoice', async () => {
      const { bill: openedBill } = await openBill();
      const { body } = await attachInvoice(openedBill.id);

      await request()
        .delete(`/api/v1/bills/${openedBill.id}/invoices/${body.data.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(204);

      expect(
        await prisma.invoice.findUnique({ where: { id: body.data.id } }),
      ).toBeNull();
    });

    it('never deletes a cancelled invoice', async () => {
      const { bill: openedBill } = await openBill();
      const { body } = await attachInvoice(openedBill.id);
      await prisma.invoice.create({
        data: {
          eventBillId: openedBill.id,
          source: 'UPLOADED',
          type: 'CANCELLATION',
          cancelsInvoiceId: body.data.id,
        },
      });

      await request()
        .delete(`/api/v1/bills/${openedBill.id}/invoices/${body.data.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });

    it('never deletes an issued invoice', async () => {
      const { bill: openedBill } = await openBill();
      const invoice = await prisma.invoice.create({
        data: {
          eventBillId: openedBill.id,
          source: 'GENERATED',
          number: '2026-0001',
        },
      });

      await request()
        .delete(`/api/v1/bills/${openedBill.id}/invoices/${invoice.id}`)
        .auth(await adminToken(), { type: 'bearer' })
        .expect(409);
    });
  });
});
