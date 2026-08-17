import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { sanitizeHtmlContent } from '#utils/sanitize';
import {
  composePrivacyNotice,
  emptyPrivacyNoticeContent,
  isEmptyAddendum,
  privacyNoticeCompleteness,
  retentionExceptions,
  supervisoryAuthorityFor,
  type CampPrivacyNotice,
  type OrganizationPrivacyNotice,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import { LegalService } from '#app/legal/legal.service';
import type { Prisma } from '#generated/prisma/client.js';

/** Lets the version lookups run either standalone or inside a publish transaction. */
type PrivacyNoticeClient = Pick<
  Prisma.TransactionClient,
  'privacyNoticeVersion'
>;

/**
 * Which notice versions a registration must be stamped with. All three may be
 * null — an organization that never published one collects data under the
 * platform notice alone, which is a gap the moderation flow closes, not
 * something the registration endpoint may fail on.
 */
export interface PrivacyNoticeStamp {
  organizationPrivacyNoticeVersionId: string | null;
  campPrivacyNoticeVersionId: string | null;
  platformPrivacyPolicyUpdatedAt: Date | null;
}

@injectable()
export class PrivacyNoticeService extends BaseService {
  constructor(
    @inject(LegalService) private readonly legalService: LegalService,
  ) {
    super();
  }

  /**
   * The published notice, which is also what the editor loads. There is no
   * draft: an unpublished edit lives in the author's browser and nowhere else.
   */
  async getOrganizationNotice(
    organizationId: string,
  ): Promise<OrganizationPrivacyNotice> {
    const published = await this.latestVersion('ORGANIZATION', organizationId);

    return {
      content:
        (published?.content as PrivacyNoticeContent | undefined) ??
        emptyPrivacyNoticeContent(),
      publishedVersion: published?.version ?? null,
      publishedAt: published?.publishedAt.toISOString() ?? null,
    };
  }

  /**
   * The only write. Publishing deliberately leaves `verificationStatus` alone:
   * demoting the organization would pull its live camps into a pending state
   * and teach everyone not to touch the notice again.
   */
  async publishOrganizationNotice(
    organizationId: string,
    content: PrivacyNoticeContent,
  ): Promise<OrganizationPrivacyNotice> {
    const sanitized = this.sanitizeContent(content);
    const completeness = privacyNoticeCompleteness(sanitized);

    if (!completeness.complete) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        `Privacy notice is incomplete: ${completeness.gaps.join(', ')}`,
      );
    }

    await this.appendVersion('ORGANIZATION', organizationId, sanitized);

    return this.getOrganizationNotice(organizationId);
  }

  /**
   * Why this organization may not be verified yet, or null when nothing stands
   * in the way. Published rather than merely written: information the public
   * cannot read has not been given to the data subject.
   */
  async verificationBlocker(organizationId: string): Promise<string | null> {
    const published = await this.latestVersion('ORGANIZATION', organizationId);

    return published ? null : 'its privacy notice has not been published';
  }

  async getCampAddendum(campId: string): Promise<PrivacyNoticeAddendum> {
    const published = await this.latestVersion('CAMP', campId);

    return (published?.content as PrivacyNoticeAddendum | undefined) ?? {};
  }

  /**
   * The camp's published addendum together with the organization notice it is
   * added to — the editor has to show an author what their organization already
   * says before it can show what the camp adds to it.
   */
  async getCampNotice(campId: string): Promise<CampPrivacyNotice> {
    const camp = await this.prisma.camp.findUniqueOrThrow({
      where: { id: campId },
      select: { organizationId: true },
    });

    const [organizationVersion, campVersion] = await Promise.all([
      this.latestVersion('ORGANIZATION', camp.organizationId),
      this.latestVersion('CAMP', campId),
    ]);

    return {
      content:
        (campVersion?.content as PrivacyNoticeAddendum | undefined) ?? {},
      organizationContent:
        (organizationVersion?.content as PrivacyNoticeContent | undefined) ??
        null,
      organizationPublishedVersion: organizationVersion?.version ?? null,
      organizationPublishedAt:
        organizationVersion?.publishedAt.toISOString() ?? null,
      publishedVersion: campVersion?.version ?? null,
      publishedAt: campVersion?.publishedAt.toISOString() ?? null,
    };
  }

  /**
   * No completeness gate: an addendum is optional by nature, and a camp that
   * has nothing to add says so by adding nothing. An empty addendum is refused
   * as a first version — it would say the same as no version at all — but
   * accepted once a version exists, because withdrawing every addition is the
   * only way back to the organization's notice on its own. The withdrawal is a
   * version of its own rather than a deletion: registrations are stamped with
   * the version they were shown, so no version may disappear.
   */
  async publishCampAddendum(
    campId: string,
    content: PrivacyNoticeAddendum,
  ): Promise<CampPrivacyNotice> {
    const sanitized = this.sanitizeAddendum(content);

    if (
      isEmptyAddendum(sanitized) &&
      !(await this.latestVersion('CAMP', campId))
    ) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        'Privacy notice addendum is empty.',
      );
    }

    await this.appendVersion('CAMP', campId, sanitized);

    return this.getCampNotice(campId);
  }

  /**
   * Appends a version unless it would say exactly what the current one says.
   * Both sides come out of the same sanitizer, so key order matches and a
   * string compare is enough — and a false "changed" only costs a version
   * number, where a false "same" would silently drop a real edit.
   */
  private async appendVersion(
    scope: 'ORGANIZATION' | 'CAMP',
    scopeId: string,
    content: PrivacyNoticeContent | PrivacyNoticeAddendum,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const latest = await this.latestVersion(scope, scopeId, tx);

      if (
        latest &&
        JSON.stringify(latest.content) === JSON.stringify(content)
      ) {
        return;
      }

      await tx.privacyNoticeVersion.create({
        data: {
          scope,
          scopeId,
          version: (latest?.version ?? 0) + 1,
          content,
        },
      });
    });
  }

  /**
   * What a registrant is served. Reads the published versions, so an edit still
   * open in an author's browser cannot change what the public page says.
   */
  async getPublishedNotice(campId: string): Promise<PublishedPrivacyNotice> {
    const camp = await this.prisma.camp.findUniqueOrThrow({
      where: { id: campId },
      include: { organization: true },
    });

    const [organizationVersion, campVersion] = await Promise.all([
      this.latestVersion('ORGANIZATION', camp.organizationId),
      this.latestVersion('CAMP', campId),
    ]);

    const organization = camp.organization;

    return {
      controller: {
        name: organization.name,
        contactEmail: organization.contactEmail,
        phone: organization.phone,
        website: organization.website,
        addressStreet: organization.addressStreet,
        addressZipCode: organization.addressZipCode,
        addressCity: organization.addressCity,
        country: organization.country,
        registrationNumber: organization.registrationNumber,
      },
      supervisoryAuthority: supervisoryAuthorityFor(organization.country),
      notice: organizationVersion
        ? composePrivacyNotice(
            organizationVersion.content as PrivacyNoticeContent,
            campVersion?.content as PrivacyNoticeAddendum | undefined,
          )
        : null,
      organizationVersion: organizationVersion?.version ?? null,
      campVersion: campVersion?.version ?? null,
    };
  }

  /** Resolved once per registration, at submission, and then never recomputed. */
  async getStampForCamp(
    campId: string,
    organizationId: string,
  ): Promise<PrivacyNoticeStamp> {
    const [organizationVersion, campVersion, platformPolicy] =
      await Promise.all([
        this.latestVersion('ORGANIZATION', organizationId),
        this.latestVersion('CAMP', campId),
        this.legalService.getDocument('PRIVACY_POLICY'),
      ]);

    return {
      organizationPrivacyNoticeVersionId: organizationVersion?.id ?? null,
      campPrivacyNoticeVersionId: campVersion?.id ?? null,
      platformPrivacyPolicyUpdatedAt: platformPolicy.updatedAt ?? null,
    };
  }

  private async latestVersion(
    scope: 'ORGANIZATION' | 'CAMP',
    scopeId: string,
    client: PrivacyNoticeClient = this.prisma,
  ) {
    return client.privacyNoticeVersion.findFirst({
      where: { scope, scopeId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * The free-text sections are HTML written by an organization administrator —
   * a less trusted author than the instance administrator behind
   * `LegalDocument`, so it is sanitized on the way in rather than trusted on
   * the way out.
   */
  private sanitizeContent(content: PrivacyNoticeContent): PrivacyNoticeContent {
    return {
      ...content,
      purposes: content.purposes.map((purpose) => ({
        ...purpose,
        legitimateInterest: this.sanitizeTranslatable(
          purpose.legitimateInterest,
        ),
      })),
      retention: content.retention
        ? {
            ...content.retention,
            exceptions: retentionExceptions(content.retention).map(
              (exception) => ({
                ...exception,
                label: this.sanitizeTranslatable(exception.label),
                reason: this.sanitizeTranslatable(exception.reason),
              }),
            ),
          }
        : null,
      thirdCountryTransfers: {
        ...content.thirdCountryTransfers,
        note: this.sanitizeTranslatable(content.thirdCountryTransfers.note),
      },
      automatedDecisionMakingDetails: this.sanitizeTranslatable(
        content.automatedDecisionMakingDetails,
      ),
      additional: this.sanitizeTranslatable(content.additional),
      freeText: this.sanitizeTranslatable(content.freeText),
    };
  }

  /** The addendum's subset of the same fields, authored by a camp manager. */
  private sanitizeAddendum(
    content: PrivacyNoticeAddendum,
  ): PrivacyNoticeAddendum {
    return {
      ...content,
      purposes: content.purposes?.map((purpose) => ({
        ...purpose,
        legitimateInterest: this.sanitizeTranslatable(
          purpose.legitimateInterest,
        ),
      })),
      retention: content.retention
        ? {
            ...content.retention,
            exceptions: retentionExceptions(content.retention).map(
              (exception) => ({
                ...exception,
                label: this.sanitizeTranslatable(exception.label),
                reason: this.sanitizeTranslatable(exception.reason),
              }),
            ),
          }
        : content.retention,
      thirdCountryTransfers: content.thirdCountryTransfers
        ? {
            ...content.thirdCountryTransfers,
            note: this.sanitizeTranslatable(content.thirdCountryTransfers.note),
          }
        : content.thirdCountryTransfers,
      additional: this.sanitizeTranslatable(content.additional),
    };
  }

  private sanitizeTranslatable(
    value: Translatable | null | undefined,
  ): Translatable | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return sanitizeHtmlContent(value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([locale, text]) => [
        locale,
        sanitizeHtmlContent(text),
      ]),
    );
  }
}
