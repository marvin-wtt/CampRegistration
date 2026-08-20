import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  OrganizationFactory,
  PrivacyNoticeFactory,
  UserFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { emptyPrivacyNoticeContent } from '@camp-registration/common/privacy';
import { campListed } from './fixtures/registration.fixtures.js';

/** An organization whose notice was never published — the blocked state. */
const organizationWithoutNotice = async (
  verificationStatus: 'PENDING' | 'VERIFIED' = 'PENDING',
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

const campManagerToken = async (campId: string) => {
  const user = await UserFactory.create();
  await prisma.campManager.create({
    data: { campId, userId: user.id, role: 'DIRECTOR' },
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
              { key: 'camp_staff' },
              { key: 'platform_operator', name: '<i>Acme</i>' },
            ],
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.content.purposes[0].label.en).toBe('Archery');
      expect(body.data.content.dataCategories[0].label.en).toBe('Skill');
      expect(body.data.content.recipients[1].name).toBe('Acme');
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
            retention: { months: 6, anchor: 'submission', exceptions: [] },
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
        retention: { months: 24, anchor: 'camp_end' },
      });
      expect(versions[1]?.content).toMatchObject({
        retention: { months: 6, anchor: 'submission' },
      });
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

    it('should not change the verification status', async () => {
      const organization = await OrganizationFactory.create({
        verificationStatus: 'VERIFIED',
      });
      const accessToken = await organizationAdmin(organization.id);

      await request()
        .put(publishUrl(organization.id))
        .send({
          content: completePrivacyNoticeContent({
            retention: { months: 6, anchor: 'submission', exceptions: [] },
          }),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.organization.findUnique({
        where: { id: organization.id },
      });

      // Editing the notice must not pull the organization's live camps into a
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

  describe('GET /api/v1/camps/:campId/privacy-notice/addendum', () => {
    it('should return the published addendum with the organization baseline', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });
      await PrivacyNoticeFactory.createCampAddendum(camp.id, {
        recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content.recipients).toEqual([
        { key: 'transport_provider', name: 'Bus Co' },
      ]);
      // The baseline is what a camp adds to, so the editor can mark the
      // entries the organization has already declared.
      expect(
        body.data.organizationContent.dataCategories.map(
          (entry: { key: string }) => entry.key,
        ),
      ).toEqual(['identity', 'contact']);
      expect(body.data.organizationPublishedVersion).toBe(1);
      expect(body.data.publishedVersion).toBe(1);
    });

    it('should return an empty addendum for a camp that added nothing', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content).toEqual({});
      expect(body.data.publishedVersion).toBeNull();
      expect(body.data.organizationContent).not.toBeNull();
    });

    it('should report a null baseline when the organization published none', async () => {
      const organization = await organizationWithoutNotice('VERIFIED');
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.organizationContent).toBeNull();
      expect(body.data.organizationPublishedVersion).toBeNull();
    });

    it('should respond with `403` for a stranger', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });
      const stranger = await UserFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .auth(generateAccessToken(stranger), { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PUT /api/v1/camps/:campId/privacy-notice/addendum', () => {
    it('should refuse an empty addendum', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({ content: {} })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(422);
    });

    it('should accept an empty addendum that withdraws published additions', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });
      await PrivacyNoticeFactory.createCampAddendum(camp.id, {
        recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      });

      const { body } = await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({ content: {} })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.publishedVersion).toBe(2);
      expect(body.data.content.recipients ?? []).toStrictEqual([]);

      // The withdrawal is a version of its own, so registrations stamped with
      // the old one still resolve — but the camp adds nothing any more.
      const published = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice`)
        .expect(200);

      expect(published.body.data.campVersion).toBe(2);
      expect(
        published.body.data.notice.recipients.map(
          (recipient: { key: string }) => recipient.key,
        ),
      ).not.toContain('transport_provider');
    });

    it('should refuse a special category the camp adds with no Art. 9 basis', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({ content: { dataCategories: [{ key: 'health' }] } })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(422);
    });

    it('should accept the same category once the camp names its basis', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({
          content: {
            dataCategories: [
              { key: 'health', specialCategoryBasis: 'explicit_consent' },
            ],
          },
        })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);
    });

    it('should refuse a legitimate interest the camp relies on but does not name', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({
          content: {
            purposes: [
              { key: 'photo_documentation', legalBasis: 'legitimate_interests' },
            ],
          },
        })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(422);
    });

    it('should not hold a camp to gaps its organization never closed', async () => {
      const organization = await organizationWithoutNotice();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({ content: { recipients: [{ key: 'transport_provider' }] } })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);
    });

    it('should sanitize the addendum free text', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({
          content: { additional: { en: '<p>Ok</p><script>alert(1)</script>' } },
        })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      expect(body.data.content.additional.en).toBe('<p>Ok</p>');
    });
  });

  describe('GET /api/v1/camps/:campId/privacy-notice', () => {
    it('should compose the organization notice with the camp addendum', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const beforePublish = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice`)
        .expect(200);
      expect(beforePublish.body.data.campVersion).toBeNull();
      expect(
        beforePublish.body.data.notice.recipients.map(
          (r: { key: string }) => r.key,
        ),
      ).not.toContain('transport_provider');

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({
          content: {
            recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
          },
        })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice`)
        .expect(200);

      expect(body.data.controller.name).toBe(organization.name);
      expect(body.data.supervisoryAuthority).not.toBeNull();
      expect(body.data.campVersion).toBe(1);
      expect(
        body.data.notice.recipients.map((r: { key: string }) => r.key),
      ).toContain('transport_provider');
    });

    it('should keep the organization retention exceptions a camp adds to', async () => {
      const organization = await OrganizationFactory.create(
        {},
        {
          privacyNotice: completePrivacyNoticeContent({
            retention: {
              months: 24,
              anchor: 'camp_end',
              exceptions: [
                {
                  scope: 'payment_and_invoicing',
                  months: 120,
                  anchor: 'camp_end',
                },
              ],
            },
          }),
        },
      );
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .put(`/api/v1/camps/${camp.id}/privacy-notice/addendum`)
        .send({
          content: {
            retention: {
              months: 24,
              anchor: 'camp_end',
              exceptions: [
                { scope: 'photo_publication', months: 36, anchor: 'camp_end' },
              ],
            },
          },
        })
        .auth(await campManagerToken(camp.id), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice`)
        .expect(200);

      // A camp naming one exception must not silently drop the statutory one
      // its organization declared.
      expect(
        body.data.notice.retention.exceptions.map(
          (e: { scope: string }) => e.scope,
        ),
      ).toEqual(['payment_and_invoicing', 'photo_publication']);
    });

    it('should report a null notice when the organization published none', async () => {
      const organization = await organizationWithoutNotice('VERIFIED');
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/privacy-notice`)
        .expect(200);

      expect(body.data.notice).toBeNull();
      // The controller is still named — that part never depended on the notice.
      expect(body.data.controller.name).toBe(organization.name);
    });
  });

  describe('registration stamping', () => {
    it('should record the notice versions the registrant was shown', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        ...campListed,
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: { first_name: 'Ada', last_name: 'Lovelace' } })
        .expect(201);

      const registration = await prisma.registration.findUniqueOrThrow({
        where: { id: body.data.id },
        include: { organizationPrivacyNotice: true },
      });

      expect(registration.organizationPrivacyNoticeVersionId).not.toBeNull();
      expect(registration.organizationPrivacyNotice?.version).toBe(1);
      expect(registration.campPrivacyNoticeVersionId).toBeNull();
    });

    it('should keep the stamped version unchanged when the notice is published again', async () => {
      const organization = await OrganizationFactory.create();
      const camp = await CampFactory.create({
        ...campListed,
        organization: { connect: { id: organization.id } },
      });
      const accessToken = await organizationAdmin(organization.id);

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/registrations`)
        .send({ data: { first_name: 'Ada', last_name: 'Lovelace' } })
        .expect(201);

      await request()
        .put(`/api/v1/organizations/${organization.id}/privacy-notice`)
        .send({
          content: completePrivacyNoticeContent({
            retention: { months: 1, anchor: 'submission', exceptions: [] },
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
        retention: { months: 24, anchor: 'camp_end' },
      });
    });
  });
});
