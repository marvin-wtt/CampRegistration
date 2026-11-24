import { describe, expect, it, vi } from 'vitest';
import { NoOpMailer } from '#core/mail/drivers/noop.mailer';
import {
  EventFactory,
  OrganizationFactory,
  PrivacyNoticeFactory,
  UserFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import {
  emptyPrivacyNoticeContent,
  type PrivacyNoticeContent,
} from '@camp-registration/common/privacy';
import { eventListed } from './fixtures/registration.fixtures.js';

/** An organization whose notice was never published — the blocked state. */
const organizationWithoutNotice = async (
  verificationStatus: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING',
) =>
  OrganizationFactory.create({ verificationStatus }, { privacyNotice: null });

const adminToken = async () => {
  const admin = await UserFactory.create({ role: 'ADMIN' });

  return generateAccessToken(admin);
};

const organizationAdmin = async (organizationId: string) => {
  const user = await UserFactory.create();
  await prisma.organizationMember.create({
    data: { organizationId, userId: user.id, role: 'ADMIN' },
  });

  return generateAccessToken(user);
};

const eventManagerToken = async (eventId: string) => {
  const user = await UserFactory.create();
  await prisma.eventManager.create({
    data: { eventId, userId: user.id, role: 'DIRECTOR' },
  });

  return generateAccessToken(user);
};

describe('privacy notices', () => {
  describe('GET /api/v1/organizations/:organizationId/privacy-notice', () => {
    it('should respond with an empty notice when none was ever published', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .get(`/api/v1/organizations/${organization.id}/privacy-notice`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.publishedVersion).toBeNull();
      expect(body.data.content.purposes).toEqual([]);
      expect(body.data.completeness.complete).toBe(false);
      expect(body.data.completeness.gaps).toContain('purposes');
    });

    it('should respond with the published notice', async () => {
      const organization = await OrganizationFactory.create();
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .get(`/api/v1/organizations/${organization.id}/privacy-notice`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.publishedVersion).toBe(1);
      expect(body.data.publishedAt).not.toBeNull();
      expect(body.data.completeness.complete).toBe(true);
    });

    it('should respond with `403` for a stranger', async () => {
      const organization = await organizationWithoutNotice();
      const stranger = await UserFactory.create();

      await request()
        .get(`/api/v1/organizations/${organization.id}/privacy-notice`)
        .auth(generateAccessToken(stranger), { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PUT /api/v1/organizations/:organizationId/privacy-notice', () => {
    const publishUrl = (organizationId: string) =>
      `/api/v1/organizations/${organizationId}/privacy-notice`;

    it('should publish the submitted content', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .put(publishUrl(organization.id))
        .send({ content: completePrivacyNoticeContent() })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.publishedVersion).toBe(1);
      expect(body.data.completeness.complete).toBe(true);
    });

    it('should refuse to publish an incomplete notice', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({ content: emptyPrivacyNoticeContent() })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);

      const versions = await prisma.privacyNoticeVersion.count({
        where: { scope: 'ORGANIZATION', scopeId: organization.id },
      });
      expect(versions).toBe(0);
    });

    it('should refuse an organization entry with an event key', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            recipients: [
              { key: 'event_staff' },
              { key: 'platform_operator' },
              { key: 'custom:event-1', label: { en: 'Host families' } },
            ],
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should refuse a law the platform has no record of', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: { ...completePrivacyNoticeContent(), framework: 'other' },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should publish a free-text notice citing no law', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: {
            ...emptyPrivacyNoticeContent(),
            framework: 'kdg',
            mode: 'free_text',
            freeText: { en: '<p>Our notice</p>' },
            supervisoryAuthority: { name: 'Left over', website: null },
          },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const version = await prisma.privacyNoticeVersion.findFirstOrThrow({
        where: { scope: 'ORGANIZATION', scopeId: organization.id },
      });
      expect(version.content).toMatchObject({ framework: null });
      expect(version.content).not.toHaveProperty('frameworkVersion');
      expect(version.content).not.toHaveProperty('supervisoryAuthority');
    });

    it('should refuse Art. 9(2)(g) without the law it rests on', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);
      const content = completePrivacyNoticeContent();

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: {
            ...content,
            dataCategories: [
              ...content.dataCategories,
              { key: 'health', specialCategoryBasis: 'public_interest' },
            ],
          },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should keep a legal reference only with Art. 9(2)(g)', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);
      const content = completePrivacyNoticeContent();

      const { body } = await request()
        .put(publishUrl(organization.id))
        .send({
          content: {
            ...content,
            dataCategories: [
              ...content.dataCategories,
              {
                key: 'health',
                specialCategoryBasis: 'public_interest',
                legalReference: '§ 1 Example Act',
              },
              {
                key: 'allergies',
                specialCategoryBasis: 'explicit_consent',
                legalReference: 'left over from (g)',
              },
            ],
          },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const categories = body.data.content.dataCategories as {
        key: string;
        legalReference?: string;
      }[];
      expect(categories.find((c) => c.key === 'health')?.legalReference).toBe(
        '§ 1 Example Act',
      );
      expect(categories.find((c) => c.key === 'allergies')).not.toHaveProperty(
        'legalReference',
      );
    });

    describe('under a church framework', () => {
      const churchNotice = (
        framework: 'kdg' | 'dsg_ekd',
        overrides: Partial<PrivacyNoticeContent> = {},
      ): PrivacyNoticeContent => ({
        ...completePrivacyNoticeContent(),
        framework,
        supervisoryAuthority: {
          name: 'Katholisches Datenschutzzentrum',
          website: 'https://www.example.org',
        },
        ...overrides,
      });

      it('should publish a guided notice and stamp the cited record', async () => {
        const organization = await organizationWithoutNotice();
        const accessToken = await organizationAdmin(organization.id);

        await request()
          .put(publishUrl(organization.id))
          .send({
            content: {
              ...churchNotice('kdg'),
              // The client cannot pick the citations it is shown with.
              frameworkVersion: 'made-up',
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const version = await prisma.privacyNoticeVersion.findFirstOrThrow({
          where: { scope: 'ORGANIZATION', scopeId: organization.id },
        });
        expect(version.content).toMatchObject({
          framework: 'kdg',
          frameworkVersion: 'kdg-2025-11-24',
          supervisoryAuthority: { name: 'Katholisches Datenschutzzentrum' },
        });
      });

      it('should refuse a church law outside its country', async () => {
        const organization = await OrganizationFactory.create(
          { country: 'fr', verificationStatus: 'PENDING' },
          { privacyNotice: null },
        );
        const accessToken = await organizationAdmin(organization.id);

        await request()
          .put(publishUrl(organization.id))
          .send({ content: churchNotice('kdg') })
          .auth(accessToken, { type: 'bearer' })
          .expect(422);
      });

      it('should refuse an authority website that is not http(s)', async () => {
        const organization = await organizationWithoutNotice();
        const accessToken = await organizationAdmin(organization.id);

        await request()
          .put(publishUrl(organization.id))
          .send({
            content: churchNotice('kdg', {
              supervisoryAuthority: {
                name: 'Datenschutzaufsicht',
                website: 'javascript:alert(document.cookie)',
              },
            }),
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should refuse a notice that names no supervisory authority', async () => {
        const organization = await organizationWithoutNotice();
        const accessToken = await organizationAdmin(organization.id);

        const { body } = await request()
          .put(publishUrl(organization.id))
          .send({
            content: churchNotice('dsg_ekd', { supervisoryAuthority: null }),
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(422);

        expect(JSON.stringify(body)).toContain('supervisory_authority');
      });

      it('should keep no authority on a GDPR notice', async () => {
        const organization = await organizationWithoutNotice();
        const accessToken = await organizationAdmin(organization.id);

        await request()
          .put(publishUrl(organization.id))
          .send({
            content: {
              ...completePrivacyNoticeContent(),
              supervisoryAuthority: { name: 'Left over', website: null },
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const version = await prisma.privacyNoticeVersion.findFirstOrThrow({
          where: { scope: 'ORGANIZATION', scopeId: organization.id },
        });
        expect(version.content).not.toHaveProperty('supervisoryAuthority');
        expect(version.content).toMatchObject({
          frameworkVersion: 'gdpr-2016-679',
        });
      });
    });

    it('should refuse a purpose without a legal basis', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: {
            ...completePrivacyNoticeContent(),
            purposes: [{ key: 'photo_documentation', legalBasis: null }],
          },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should sanitize free-text HTML', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            additional: { en: '<p>Fine</p><script>alert(1)</script>' },
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.content.additional.en).toBe('<p>Fine</p>');
    });

    it('should sanitize the plain-text labels an author names entries with', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            purposes: [
              {
                key: 'custom:1',
                legalBasis: 'contract',
                label: { en: '<b>Archery</b>' },
              },
            ],
            dataCategories: [
              { key: 'custom:1', label: { en: '<img src=x onerror=1>Skill' } },
            ],
            recipients: [
              { key: 'event_staff' },
              { key: 'platform_operator', name: '<i>Acme</i>' },
              { key: 'custom:1', label: { en: '<u>Sports club</u>' } },
            ],
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.content.purposes[0].label.en).toBe('Archery');
      expect(body.data.content.dataCategories[0].label.en).toBe('Skill');
      expect(body.data.content.recipients[1].name).toBe('Acme');
      expect(body.data.content.recipients[2].label.en).toBe('Sports club');
    });

    it('should append a version and never overwrite the previous one', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      const first = await request()
        .put(publishUrl(organization.id))
        .send({ content: completePrivacyNoticeContent() })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      expect(first.body.data.publishedVersion).toBe(1);

      const second = await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            retention: {
              months: 6,
              exceptions: [],
              specialCategories: { weeks: 4 },
            },
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      expect(second.body.data.publishedVersion).toBe(2);

      const versions = await prisma.privacyNoticeVersion.findMany({
        where: { scope: 'ORGANIZATION', scopeId: organization.id },
        orderBy: { version: 'asc' },
      });

      expect(versions).toHaveLength(2);
      expect(versions[0]?.content).toMatchObject({
        retention: { months: 24 },
      });
      expect(versions[1]?.content).toMatchObject({
        retention: { months: 6 },
      });
    });

    it('should accept and drop the anchor older versions still store', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);
      const base = completePrivacyNoticeContent();

      // As the editor sends back content loaded from an older version.
      await request()
        .put(publishUrl(organization.id))
        .send({
          content: {
            ...base,
            purposes: [
              ...base.purposes,
              { key: 'photo_publication', legalBasis: 'consent' },
            ],
            retention: {
              months: 24,
              anchor: 'event_end',
              exceptions: [
                {
                  scope: 'photo_publication',
                  until: 'consent_withdrawn',
                  months: 36,
                  anchor: 'event_end',
                },
              ],
              specialCategories: { weeks: 4, anchor: 'event_end' },
            },
          },
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const version = await prisma.privacyNoticeVersion.findFirstOrThrow({
        where: { scope: 'ORGANIZATION', scopeId: organization.id },
      });
      expect(JSON.stringify(version.content)).not.toContain('anchor');
    });

    it('should not append a version when nothing changed', async () => {
      const organization = await organizationWithoutNotice();
      const accessToken = await organizationAdmin(organization.id);

      for (let i = 0; i < 2; i++) {
        await request()
          .put(publishUrl(organization.id))
          .send({ content: completePrivacyNoticeContent() })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);
      }

      // Publishing twice says the same thing twice; a version number the
      // registrant is told must mean a real change.
      const versions = await prisma.privacyNoticeVersion.count({
        where: { scope: 'ORGANIZATION', scopeId: organization.id },
      });
      expect(versions).toBe(1);
    });

    it('should submit a draft organization for review', async () => {
      const moderator = await UserFactory.create({
        role: 'ADMIN',
        email: 'mod@example.com',
      });
      const organization = await organizationWithoutNotice('DRAFT');
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({ content: completePrivacyNoticeContent() })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.organization.findUnique({
        where: { id: organization.id },
      });
      expect(updated?.verificationStatus).toBe('PENDING');
      expect(updated?.submittedAt).not.toBeNull();

      const recipients = vi
        .mocked(NoOpMailer.prototype.sendMail)
        .mock.calls.map((call) => call[0].to);
      expect(JSON.stringify(recipients)).toContain(moderator.email);
    });

    it('should not resubmit a rejected organization', async () => {
      const organization = await organizationWithoutNotice('REJECTED');
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({ content: completePrivacyNoticeContent() })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.organization.findUnique({
        where: { id: organization.id },
      });
      // Resubmitting after a rejection stays the owner's explicit request.
      expect(updated?.verificationStatus).toBe('REJECTED');
    });

    it('should not change the verification status', async () => {
      const organization = await OrganizationFactory.create({
        verificationStatus: 'VERIFIED',
      });
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            retention: {
              months: 6,
              exceptions: [],
              specialCategories: { weeks: 4 },
            },
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.organization.findUnique({
        where: { id: organization.id },
      });

      // Editing the notice must not pull the organization's live events into a
      // pending state — that would teach everyone never to touch it again.
      expect(updated?.verificationStatus).toBe('VERIFIED');
    });

    it('should respond with `403` for a plain member', async () => {
      const organization = await organizationWithoutNotice();
      const user = await UserFactory.create();
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'MEMBER',
        },
      });

      await request()
        .put(publishUrl(organization.id))
        .send({ content: completePrivacyNoticeContent() })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/organizations/:organizationId/verification', () => {
    it('should refuse to verify an organization without a published notice', async () => {
      const organization = await organizationWithoutNotice();

      const { body } = await request()
        .patch(`/api/v1/organizations/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(422);

      expect(body.message).toMatch(/privacy notice/i);

      const updated = await prisma.organization.findUnique({
        where: { id: organization.id },
      });
      expect(updated?.verificationStatus).toBe('PENDING');
    });

    it('should still allow rejecting an organization without a notice', async () => {
      const organization = await organizationWithoutNotice();

      await request()
        .patch(`/api/v1/organizations/${organization.id}/verification`)
        .send({ status: 'REJECTED', reviewNote: 'No privacy information.' })
        .auth(await adminToken(), { type: 'bearer' })
        .expect(200);
    });
  });

  describe('GET /api/v1/events/:eventId/privacy-notice/addendum', () => {
    it('should return the published addendum with the organization baseline', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });
      await PrivacyNoticeFactory.createEventAddendum(event.id, {
        recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content.recipients).toEqual([
        { key: 'transport_provider', name: 'Bus Co' },
      ]);
      // The baseline is what a event adds to, so the editor can mark the
      // entries the organization has already declared.
      expect(
        body.data.organizationContent.dataCategories.map(
          (entry: { key: string }) => entry.key,
        ),
      ).toEqual(['identity', 'contact']);
      expect(body.data.organizationPublishedVersion).toBe(1);
      expect(body.data.publishedVersion).toBe(1);
    });

    it('should return an empty addendum for a event that added nothing', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content).toEqual({});
      expect(body.data.publishedVersion).toBeNull();
      expect(body.data.organizationContent).not.toBeNull();
    });

    it('should report a null baseline when the organization published none', async () => {
      const organization = await organizationWithoutNotice('VERIFIED');
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.organizationContent).toBeNull();
      expect(body.data.organizationPublishedVersion).toBeNull();
    });

    it('should respond with `403` for a stranger', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });
      const stranger = await UserFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .auth(generateAccessToken(stranger), { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PUT /api/v1/events/:eventId/privacy-notice/addendum', () => {
    it('should refuse an empty addendum', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({ content: {} })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(422);
    });

    it('should accept an empty addendum that withdraws published additions', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });
      await PrivacyNoticeFactory.createEventAddendum(event.id, {
        recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      });

      const { body } = await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({ content: {} })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.publishedVersion).toBe(2);
      expect(body.data.content.recipients ?? []).toStrictEqual([]);

      // The withdrawal is a version of its own, so registrations stamped with
      // the old one still resolve — but the event adds nothing any more.
      const published = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      expect(published.body.data.eventVersion).toBe(2);
      expect(
        published.body.data.notice.recipients.map(
          (recipient: { key: string }) => recipient.key,
        ),
      ).not.toContain('transport_provider');
    });

    it('should refuse a special category the event adds with no Art. 9 basis', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({ content: { dataCategories: [{ key: 'health' }] } })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(422);
    });

    it('should accept the same category once the event names its basis', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({
          content: {
            dataCategories: [
              { key: 'health', specialCategoryBasis: 'explicit_consent' },
            ],
          },
        })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);
    });

    it('should refuse a legitimate interest the event relies on but does not name', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({
          content: {
            purposes: [
              {
                key: 'photo_documentation',
                legalBasis: 'legitimate_interests',
              },
            ],
          },
        })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(422);
    });

    it('should not hold a event to gaps its organization never closed', async () => {
      const organization = await organizationWithoutNotice();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({ content: { recipients: [{ key: 'transport_provider' }] } })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);
    });

    describe('exclusions', () => {
      const eventOf = async (data: Partial<PrivacyNoticeContent> = {}) => {
        const organization = await OrganizationFactory.create(
          {},
          {
            privacyNotice: completePrivacyNoticeContent({
              purposes: [
                { key: 'registration_administration', legalBasis: 'contract' },
                { key: 'medical_care', legalBasis: 'contract' },
              ],
              dataCategories: [
                { key: 'identity' },
                { key: 'health', specialCategoryBasis: 'explicit_consent' },
              ],
              ...data,
            }),
          },
        );

        return EventFactory.create({
          organization: { connect: { id: organization.id } },
        });
      };

      const publish = async (eventId: string, content: object) =>
        request()
          .put(`/api/v1/events/${eventId}/privacy-notice/addendum`)
          .send({ content })
          .auth(await eventManagerToken(eventId), { type: 'bearer' });

      it('should drop excluded organization entries from the published notice', async () => {
        const event = await eventOf();

        await publish(event.id, {
          excluded: { purposes: ['medical_care'], dataCategories: ['health'] },
        }).then((res) => expect(res.status).toBe(200));

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/privacy-notice`)
          .expect(200);
        const keys = (entries: { key: string }[]) =>
          entries.map((entry) => entry.key);

        expect(keys(body.data.notice.purposes)).not.toContain('medical_care');
        expect(keys(body.data.notice.dataCategories)).not.toContain('health');
      });

      it('should drop exclusions of keys the organization does not declare', async () => {
        const event = await eventOf();

        const { body } = await publish(event.id, {
          excluded: { purposes: ['medical_care', 'newsletter'] },
        });

        expect(body.data.content.excluded).toStrictEqual({
          purposes: ['medical_care'],
        });
      });

      it('should refuse excluding an entry that applies to every event', async () => {
        const event = await eventOf({
          dataCategories: [
            { key: 'identity' },
            {
              key: 'health',
              specialCategoryBasis: 'explicit_consent',
              allEvents: true,
            },
          ],
        });

        await publish(event.id, {
          excluded: { dataCategories: ['health'] },
        }).then((res) => expect(res.status).toBe(422));
      });

      it('should refuse excluding an always-present recipient', async () => {
        const event = await eventOf();

        await publish(event.id, {
          excluded: { recipients: ['platform_operator'] },
        }).then((res) => expect(res.status).toBe(422));
      });

      it('should refuse excluding the last category', async () => {
        const event = await eventOf();

        await publish(event.id, {
          excluded: { dataCategories: ['identity', 'health'] },
        }).then((res) => expect(res.status).toBe(422));
      });
    });

    describe('under a free-text organization notice', () => {
      const freeTextEvent = async () => {
        const organization = await OrganizationFactory.create(
          {},
          {
            privacyNotice: {
              ...emptyPrivacyNoticeContent(),
              mode: 'free_text',
              freeText: { en: '<p>Our notice</p>' },
            },
          },
        );

        return EventFactory.create({
          organization: { connect: { id: organization.id } },
        });
      };

      it('should refuse structured entries no registrant would see', async () => {
        const event = await freeTextEvent();

        await request()
          .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
          .send({
            content: {
              dataCategories: [
                { key: 'health', specialCategoryBasis: 'explicit_consent' },
              ],
            },
          })
          .auth(await eventManagerToken(event.id), { type: 'bearer' })
          .expect(422);
      });

      it('should refuse exclusions, which are structured too', async () => {
        const event = await freeTextEvent();

        await request()
          .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
          .send({ content: { excluded: { purposes: ['medical_care'] } } })
          .auth(await eventManagerToken(event.id), { type: 'bearer' })
          .expect(422);
      });

      it('should accept free text of its own', async () => {
        const event = await freeTextEvent();

        await request()
          .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
          .send({ content: { additional: { en: '<p>Bus to camp</p>' } } })
          .auth(await eventManagerToken(event.id), { type: 'bearer' })
          .expect(200);
      });
    });

    it('should sanitize the addendum free text', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({
          content: { additional: { en: '<p>Ok</p><script>alert(1)</script>' } },
        })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content.additional.en).toBe('<p>Ok</p>');
    });
  });

  describe('GET /api/v1/events/:eventId/privacy-notice', () => {
    it('should compose the organization notice with the event addendum', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const beforePublish = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);
      expect(beforePublish.body.data.eventVersion).toBeNull();
      expect(
        beforePublish.body.data.notice.recipients.map(
          (r: { key: string }) => r.key,
        ),
      ).not.toContain('transport_provider');

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({
          content: {
            recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
          },
        })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      expect(body.data.controller.name).toBe(organization.name);
      expect(body.data.supervisoryAuthority).not.toBeNull();
      expect(body.data.eventVersion).toBe(1);
      expect(
        body.data.notice.recipients.map((r: { key: string }) => r.key),
      ).toContain('transport_provider');
    });

    it('should name the authority the organization entered under a church law', async () => {
      const organization = await OrganizationFactory.create(
        { country: 'de' },
        {
          privacyNotice: {
            ...completePrivacyNoticeContent(),
            framework: 'dsg_ekd',
            frameworkVersion: 'dsg-ekd-2025-01-15',
            supervisoryAuthority: {
              name: 'Der Beauftragte für den Datenschutz der EKD',
              website: 'https://datenschutz.ekd.de',
            },
          },
        },
      );
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      expect(body.data.supervisoryAuthority).toEqual({
        name: 'Der Beauftragte für den Datenschutz der EKD',
        website: 'https://datenschutz.ekd.de',
      });
      expect(body.data.notice.frameworkVersion).toBe('dsg-ekd-2025-01-15');
    });

    it('should name no supervisory authority for a free-text notice', async () => {
      const organization = await OrganizationFactory.create(
        {},
        {
          privacyNotice: {
            ...emptyPrivacyNoticeContent(),
            framework: null,
            mode: 'free_text',
            freeText: { en: '<p>Our notice</p>' },
          },
        },
      );
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      expect(body.data.supervisoryAuthority).toBeNull();
    });

    it('should keep the organization retention exceptions a event adds to', async () => {
      const organization = await OrganizationFactory.create(
        {},
        {
          privacyNotice: completePrivacyNoticeContent({
            retention: {
              months: 24,
              specialCategories: { weeks: 4 },
              exceptions: [
                {
                  scope: 'payment_and_invoicing',
                  months: 120,
                },
              ],
            },
          }),
        },
      );
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/events/${event.id}/privacy-notice/addendum`)
        .send({
          content: {
            retention: {
              months: 24,
              specialCategories: { weeks: 4 },
              exceptions: [{ scope: 'photo_publication', months: 36 }],
            },
          },
        })
        .auth(await eventManagerToken(event.id), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      // A event naming one exception must not silently drop the statutory one
      // its organization declared.
      expect(
        body.data.notice.retention.exceptions.map(
          (e: { scope: string }) => e.scope,
        ),
      ).toEqual(['payment_and_invoicing', 'photo_publication']);
    });

    it('should report a null notice when the organization published none', async () => {
      const organization = await organizationWithoutNotice('VERIFIED');
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/privacy-notice`)
        .expect(200);

      expect(body.data.notice).toBeNull();
      // The controller is still named — that part never depended on the notice.
      expect(body.data.controller.name).toBe(organization.name);
    });
  });

  describe('registration stamping', () => {
    it('should record the notice versions the registrant was shown', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        ...eventListed,
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send({ data: { first_name: 'Ada', last_name: 'Lovelace' } })
        .expect(201);

      const registration = await prisma.registration.findUniqueOrThrow({
        where: { id: body.data.id },
        include: { organizationPrivacyNotice: true },
      });

      expect(registration.organizationPrivacyNoticeVersionId).not.toBeNull();
      expect(registration.organizationPrivacyNotice?.version).toBe(1);
      expect(registration.eventPrivacyNoticeVersionId).toBeNull();
    });

    it('should keep the stamped version unchanged when the notice is published again', async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        ...eventListed,
        organization: { connect: { id: organization.id } },
      });
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send({ data: { first_name: 'Ada', last_name: 'Lovelace' } })
        .expect(201);

      await request()
        .put(`/api/v1/organizations/${organization.id}/privacy-notice`)
        .send({
          content: completePrivacyNoticeContent({
            retention: {
              months: 1,
              exceptions: [],
              specialCategories: { weeks: 4 },
            },
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const registration = await prisma.registration.findUniqueOrThrow({
        where: { id: body.data.id },
        include: { organizationPrivacyNotice: true },
      });

      // The proof of what this person was shown must survive later edits.
      expect(registration.organizationPrivacyNotice?.content).toMatchObject({
        retention: { months: 24 },
      });
    });
  });
});
