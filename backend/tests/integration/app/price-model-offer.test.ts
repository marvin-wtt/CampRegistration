import { describe, expect, it } from 'vitest';
import {
  OrganizationFactory,
  PriceModelFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { expectEmailTo } from '../utils/mail.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import {
  eventCreateNational,
  EVENT_CREATE_ORGANIZATION_ID,
} from './fixtures/event.fixtures.js';
import { dayOf } from '#utils/date';
import { BILLING_TIME_ZONE } from '#app/billing/billing.utils';
import { resolve } from '#core/ioc/container';
import { PriceModelOfferService } from '#app/priceModel/price-model-offer.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD`, `days` from today in the billing time zone. */
const inDays = (days: number) =>
  dayOf(new Date(Date.now() + days * DAY_MS), BILLING_TIME_ZONE);

const adminToken = async () =>
  generateAccessToken(await UserFactory.create({ role: 'ADMIN' }));

/** The organization events are created for, on a model costing `price`. */
async function organizationOn(price: number) {
  const priceModel = await PriceModelFactory.create({
    pricePerRegistration: price,
  });
  const owner = await UserFactory.create();
  const organization = await OrganizationFactory.create({
    id: EVENT_CREATE_ORGANIZATION_ID,
    verificationStatus: 'VERIFIED',
    priceModel: { connect: { id: priceModel.id } },
    members: { create: { userId: owner.id, role: 'ADMIN' } },
  });

  return { organization, owner, ownerToken: generateAccessToken(owner) };
}

async function offer(
  organizationId: string,
  price: number,
  effectiveOn = inDays(30),
) {
  const next = await PriceModelFactory.create({ pricePerRegistration: price });
  const response = await request()
    .post(`/api/v1/organizations/${organizationId}/price-model-offers`)
    .send({ priceModelId: next.id, effectiveOn })
    .auth(await adminToken(), { type: 'bearer' });

  return { next, response };
}

const createEvent = (token: string) =>
  request()
    .post('/api/v1/events/')
    .send(eventCreateNational)
    .auth(token, { type: 'bearer' });

describe('price model offers', () => {
  it('applies a cheaper model at once and tells the organization', async () => {
    const { organization, owner } = await organizationOn(5);

    const { next, response } = await offer(organization.id, 3);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      outcome: 'applied',
      offer: null,
    });
    const updated = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(updated.priceModelId).toBe(next.id);
    expectEmailTo(owner.email);
  });

  it('offers a more expensive model instead of applying it', async () => {
    const { organization, owner } = await organizationOn(3);

    const { response } = await offer(organization.id, 5);

    expect(response.body.data.outcome).toBe('offered');
    expect(response.body.data.offer).toMatchObject({ acceptedAt: null });
    const unchanged = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(unchanged.priceModelId).toBe(organization.priceModelId);
    expectEmailTo(owner.email);
  });

  it('needs at least 15 days of notice for an increase', async () => {
    const { organization } = await organizationOn(3);

    const { response } = await offer(organization.id, 5, inDays(5));

    expect(response.status).toBe(400);
  });

  const accept = (organizationId: string, offerId: string, token: string) =>
    request()
      .post(
        `/api/v1/organizations/${organizationId}/price-model-offers/${offerId}/accept`,
      )
      .auth(token, { type: 'bearer' });

  it('records who accepted, but waits for the effective date', async () => {
    const { organization, owner, ownerToken } = await organizationOn(3);
    const { response } = await offer(organization.id, 5);
    const offerId = response.body.data.offer.id;

    await accept(organization.id, offerId, ownerToken).expect(200);

    const unchanged = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(unchanged.priceModelId).toBe(organization.priceModelId);
    const accepted = await prisma.priceModelOffer.findUniqueOrThrow({
      where: { id: offerId },
    });
    expect(accepted.acceptedByUserId).toBe(owner.id);
    expect(accepted.acceptedAt).not.toBeNull();
    expect(accepted.appliedAt).toBeNull();
  });

  it('switches the organization on the effective date of an accepted offer', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { next, response } = await offer(organization.id, 5);
    const offerId = response.body.data.offer.id;
    await accept(organization.id, offerId, ownerToken).expect(200);
    await prisma.priceModelOffer.update({
      where: { id: offerId },
      data: { effectiveAt: new Date(Date.now() - DAY_MS) },
    });

    await resolve(PriceModelOfferService).applyDueOffers();

    const updated = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(updated.priceModelId).toBe(next.id);
  });

  it('switches the organization at once when a due offer is accepted', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { next, response } = await offer(organization.id, 5);
    const offerId = response.body.data.offer.id;
    await prisma.priceModelOffer.update({
      where: { id: offerId },
      data: { effectiveAt: new Date(Date.now() - DAY_MS) },
    });

    await accept(organization.id, offerId, ownerToken).expect(200);

    const updated = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(updated.priceModelId).toBe(next.id);
  });

  it('drops an accepted offer once an administrator assigns a model', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { response } = await offer(organization.id, 5);
    const offerId = response.body.data.offer.id;
    await accept(organization.id, offerId, ownerToken).expect(200);
    const assigned = await PriceModelFactory.create({
      pricePerRegistration: 4,
    });

    await request()
      .put(`/api/v1/organizations/${organization.id}/price-model`)
      .send({ priceModelId: assigned.id })
      .auth(await adminToken(), { type: 'bearer' })
      .expect(200);
    await prisma.priceModelOffer.updateMany({
      data: { effectiveAt: new Date(Date.now() - DAY_MS) },
    });
    await resolve(PriceModelOfferService).applyDueOffers();

    const updated = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });
    expect(updated.priceModelId).toBe(assigned.id);
  });

  it('refuses to archive a model while it is offered', async () => {
    const { organization } = await organizationOn(3);
    const { next } = await offer(organization.id, 5);

    await request()
      .patch(`/api/v1/price-models/${next.id}`)
      .send({ archived: true })
      .auth(await adminToken(), { type: 'bearer' })
      .expect(409);
  });

  it('lets only organization admins answer', async () => {
    const { organization } = await organizationOn(3);
    const { response } = await offer(organization.id, 5);
    const member = await UserFactory.create();
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: member.id,
        role: 'MEMBER',
      },
    });

    await request()
      .post(
        `/api/v1/organizations/${organization.id}/price-model-offers/${response.body.data.offer.id}/accept`,
      )
      .auth(generateAccessToken(member), { type: 'bearer' })
      .expect(403);
  });

  it('shows the open offer on the organization billing page', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { next } = await offer(organization.id, 5);

    const { body } = await request()
      .get(`/api/v1/organizations/${organization.id}/billing`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);

    expect(body.data.offer).toMatchObject({
      acceptedAt: null,
      priceModel: { id: next.id },
    });
  });

  it('keeps showing an accepted offer until it takes effect', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { next, response } = await offer(organization.id, 5);
    await accept(organization.id, response.body.data.offer.id, ownerToken);

    const { body } = await request()
      .get(`/api/v1/organizations/${organization.id}/billing`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);

    expect(body.data.offer.acceptedAt).not.toBeNull();
    expect(body.data.offer.priceModel.id).toBe(next.id);
  });

  describe('creating events', () => {
    async function dueOffer(organizationId: string) {
      const { response } = await offer(organizationId, 5);
      const offerId: string = response.body.data.offer.id;
      // Notice is enforced on creation; move the date past for the test.
      await prisma.priceModelOffer.update({
        where: { id: offerId },
        data: { effectiveAt: new Date(Date.now() - DAY_MS) },
      });

      return offerId;
    }

    it('is still allowed before the offer is due', async () => {
      const { organization, ownerToken } = await organizationOn(3);
      await offer(organization.id, 5);

      await createEvent(ownerToken).expect(201);
    });

    it('is blocked once an unanswered offer is due', async () => {
      const { organization, ownerToken } = await organizationOn(3);
      await dueOffer(organization.id);

      const { body } = await createEvent(ownerToken).expect(409);

      expect(body.errorCode).toBe('PRICE_MODEL_NOT_ACCEPTED');
    });

    it('is allowed again once the organization accepts', async () => {
      const { organization, ownerToken } = await organizationOn(3);
      const offerId = await dueOffer(organization.id);

      await accept(organization.id, offerId, ownerToken).expect(200);
      await createEvent(ownerToken).expect(201);
    });

    it('is allowed again once an administrator assigns a model directly', async () => {
      const { organization, ownerToken } = await organizationOn(3);
      await dueOffer(organization.id);
      const agreed = await PriceModelFactory.create({
        pricePerRegistration: 4,
      });

      await request()
        .put(`/api/v1/organizations/${organization.id}/price-model`)
        .send({ priceModelId: agreed.id })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);

      await createEvent(ownerToken).expect(201);
    });

    it('is allowed again once the offer is withdrawn', async () => {
      const { organization, ownerToken } = await organizationOn(3);
      const offerId = await dueOffer(organization.id);

      await request()
        .delete(
          `/api/v1/organizations/${organization.id}/price-model-offers/${offerId}`,
        )
        .auth(await adminToken(), { type: 'bearer' })
        .expect(204);

      expect(
        await prisma.priceModelOffer.findUnique({ where: { id: offerId } }),
      ).toBeNull();
      await createEvent(ownerToken).expect(201);
    });
  });

  it('refuses to change the prices of a model an offer refers to', async () => {
    const { organization } = await organizationOn(3);
    const { next } = await offer(organization.id, 5);

    await request()
      .patch(`/api/v1/price-models/${next.id}`)
      .send({ pricePerRegistration: 6 })
      .auth(await adminToken(), { type: 'bearer' })
      .expect(409);
  });

  it('tells event creators when a change takes effect, without the prices', async () => {
    const { organization, ownerToken } = await organizationOn(3);
    const { response } = await offer(organization.id, 5);

    const { body } = await request()
      .get(
        `/api/v1/organizations/${organization.id}/price-model-offers/pending`,
      )
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);

    expect(body.data).toEqual({
      effectiveAt: response.body.data.offer.effectiveAt,
    });
  });

  it('shows the default model to anyone signed in', async () => {
    const priceModel = await PriceModelFactory.create({ isDefault: true });

    const { body } = await request()
      .get('/api/v1/price-models/default')
      .auth(generateAccessToken(await UserFactory.create()), {
        type: 'bearer',
      })
      .expect(200);

    expect(body.data.id).toBe(priceModel.id);
  });
});
