import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  OrganizationFactory,
  UserFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import { createForm } from './utils/form.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { eventListed } from './fixtures/registration.fixtures.js';

const firstName = { type: 'text', name: 'first_name', isRequired: true };
const allergies = {
  type: 'comment',
  name: 'allergies',
  privacyCategory: 'allergies',
};
const consent = {
  type: 'boolean',
  name: 'consent_health',
  title: 'I agree that the allergies of {first_name} are processed.',
  description: 'Voluntary, can be withdrawn at any time.',
  privacyConsent: true,
  privacyConsentFor: ['allergies'],
};

const healthNotice = completePrivacyNoticeContent({
  dataCategories: [
    { key: 'identity' },
    { key: 'allergies', specialCategoryBasis: 'explicit_consent' },
  ],
});

const eventWith = async (
  elements: object[],
  data: { createdAt?: Date } = {},
) => {
  const organization = await OrganizationFactory.create(
    { verificationStatus: 'VERIFIED' },
    { privacyNotice: healthNotice },
  );

  return EventFactory.create({
    ...eventListed,
    // The factory picks a past date; only events created now are enforced.
    createdAt: new Date(),
    ...data,
    form: createForm(elements),
    organization: { connect: { id: organization.id } },
  });
};

const register = (eventId: string, body: object) =>
  request().post(`/api/v1/events/${eventId}/registrations`).send(body);

describe('registration consent', () => {
  describe('registration gate', () => {
    it('should refuse registrations while a tagged category has no consent question', async () => {
      const event = await eventWith([firstName, allergies]);

      const { status } = await register(event.id, {
        data: { first_name: 'Jane' },
      });

      expect(status).not.toBe(201);
    });

    it('should refuse registrations while a tagged category is undeclared', async () => {
      const event = await eventWith([
        firstName,
        { type: 'comment', name: 'meds', privacyCategory: 'medication' },
        { ...consent, privacyConsentFor: ['medication'] },
      ]);

      const { status } = await register(event.id, {
        data: { first_name: 'Jane' },
      });

      expect(status).not.toBe(201);
    });
  });

  describe('submission', () => {
    it('should refuse sensitive answers without consent', async () => {
      const event = await eventWith([firstName, consent, allergies]);

      const { body } = await register(event.id, {
        data: { first_name: 'Jane', allergies: 'Nuts' },
      }).expect(422);

      expect(body).toHaveProperty('errorCode', 'REGISTRATION_CONSENT_MISSING');
    });

    it('should store the consent wording as shown', async () => {
      const event = await eventWith([firstName, consent, allergies]);

      const { body } = await register(event.id, {
        data: { first_name: 'Jane', consent_health: true, allergies: 'Nuts' },
      }).expect(201);

      const expected =
        'I agree that the allergies of Jane are processed.\n\nVoluntary, can be withdrawn at any time.';
      expect(body.data.consentTexts).toStrictEqual({
        consent_health: expected,
      });

      const stored = await prisma.registration.findUniqueOrThrow({
        where: { id: body.data.id },
      });
      expect(stored.consentTexts).toStrictEqual({ consent_health: expected });
    });

    it('should store nothing for a consent not given', async () => {
      const event = await eventWith([firstName, consent, allergies]);

      const { body } = await register(event.id, {
        data: { first_name: 'Jane' },
      }).expect(201);

      expect(body.data.consentTexts).toBeNull();
    });

    it('should refuse a consent text that changed while the form was open', async () => {
      const event = await eventWith([firstName, consent, allergies]);

      const { body } = await register(event.id, {
        data: { first_name: 'Jane', consent_health: true },
        displayedConsents: { consent_health: 'An older wording.' },
      }).expect(409);

      expect(body).toHaveProperty('errorCode', 'REGISTRATION_CONSENT_CHANGED');
    });
  });

  describe('manager edits', () => {
    // Managers record what may rest on consent given outside the form (say,
    // allergies a parent phoned in); that is the organizer's responsibility.
    it('should let a manager record a sensitive answer without the form consent', async () => {
      const event = await eventWith([firstName, consent, allergies]);
      const { body } = await register(event.id, {
        data: { first_name: 'Jane' },
      }).expect(201);

      const user = await UserFactory.create();
      await prisma.eventManager.create({
        data: { eventId: event.id, userId: user.id, role: 'DIRECTOR' },
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${body.data.id}`)
        .send({ data: { first_name: 'Jane', allergies: 'Nuts' } })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);
    });

    it('should copy the wording of a consent recorded later', async () => {
      const event = await eventWith([firstName, consent, allergies]);
      const { body } = await register(event.id, {
        data: { first_name: 'Jane' },
      }).expect(201);

      const user = await UserFactory.create();
      await prisma.eventManager.create({
        data: { eventId: event.id, userId: user.id, role: 'DIRECTOR' },
      });

      const response = await request()
        .patch(`/api/v1/events/${event.id}/registrations/${body.data.id}`)
        .send({
          data: { first_name: 'Jane', consent_health: true, allergies: 'Nuts' },
        })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      expect(response.body.data.consentTexts).toHaveProperty('consent_health');
    });
  });
});
