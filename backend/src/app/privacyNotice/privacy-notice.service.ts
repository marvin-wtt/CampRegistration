import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { sanitizeHtmlContent, sanitizePlainText } from '#utils/sanitize';
import {
  addendumGaps,
  composePrivacyNotice,
  emptyPrivacyNoticeContent,
  isEmptyAddendum,
  privacyNoticeCompleteness,
  retentionExceptions,
  supervisoryAuthorityFor,
  type CampPrivacyNotice,
  type OrganizationPrivacyNotice,
  type PrivacyDataCategoryEntry,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyPurposeEntry,
  type PrivacyRecipientEntry,
  type PrivacyRetention,
  type PrivacyThirdCountryTransfers,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import { LegalService } from '#app/legal/legal.service';
import { Prisma, type PrivacyNoticeVersion } from '#generated/prisma/client.js';
import type { PrivacyNoticeScope } from '#generated/prisma/enums';

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

    return this.toOrganizationNotice(published);
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

    const published = await this.appendVersion(
      'ORGANIZATION',
      organizationId,
      sanitized,
    );

    return this.toOrganizationNotice(published);
  }

  /**
   * Why this organization may not be verified yet, or null when nothing stands
   * in the way. Published rather than merely written: information the public
   * cannot read has not been given to the data subject.
   */
  async verificationBlockReason(
    organizationId: string,
  ): Promise<string | null> {
    const published = await this.latestVersion('ORGANIZATION', organizationId);

    return published ? null : 'its privacy notice has not been published';
  }

  /**
   * The camp's published addendum together with the organization notice it is
   * added to — the editor has to show an author what their organization already
   * says before it can show what the camp adds to it.
   */
  async getCampAddendum(
    campId: string,
    organizationId: string,
  ): Promise<CampPrivacyNotice> {
    const [organizationVersion, campVersion] = await Promise.all([
      this.latestVersion('ORGANIZATION', organizationId),
      this.latestVersion('CAMP', campId),
    ]);

    return this.toCampNotice(organizationVersion, campVersion);
  }

  /**
   * Saying nothing stays free: an addendum is optional by nature, and a camp
   * that has nothing to add says so by adding nothing. An empty addendum is
   * refused as a first version — it would say the same as no version at all —
   * but accepted once a version exists, because withdrawing every addition is
   * the only way back to the organization's notice on its own. The withdrawal
   * is a version of its own rather than a deletion: registrations are stamped
   * with the version they were shown, so no version may disappear.
   *
   * Saying something, however, is checked exactly as the organization's notice
   * is. The gate runs on the composed document rather than the addendum alone,
   * because the composed document is what a registrant reads: a camp adding
   * `health` owes an Art. 9 basis for it no matter what its organization
   * declared. Only the gaps the addendum itself opens are refused — see
   * `addendumGaps`.
   */
  async publishCampAddendum(
    campId: string,
    organizationId: string,
    content: PrivacyNoticeAddendum,
  ): Promise<CampPrivacyNotice> {
    const sanitized = this.sanitizeAddendum(content);
    const organizationVersion = await this.latestVersion(
      'ORGANIZATION',
      organizationId,
    );

    if (isEmptyAddendum(sanitized)) {
      if (!(await this.latestVersion('CAMP', campId))) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          'Privacy notice addendum is empty.',
        );
      }
    } else {
      const gaps = addendumGaps(
        (organizationVersion?.content as PrivacyNoticeContent | undefined) ??
          null,
        sanitized,
      );

      if (gaps.length > 0) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Privacy notice addendum is incomplete: ${gaps.join(', ')}`,
        );
      }
    }

    const campVersion = await this.appendVersion('CAMP', campId, sanitized);

    return this.toCampNotice(organizationVersion, campVersion);
  }

  /**
   * What a registrant is served. Reads the published versions, so an edit still
   * open in an author's browser cannot change what the public page says.
   */
  async getPublishedNotice(
    campId: string,
    organizationId: string,
  ): Promise<PublishedPrivacyNotice> {
    const [organization, organizationVersion, campVersion] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
      }),
      this.latestVersion('ORGANIZATION', organizationId),
      this.latestVersion('CAMP', campId),
    ]);

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

  /**
   * Appends a version unless it would say exactly what the current one says,
   * and returns whichever version is live afterwards — read inside the same
   * transaction, so a concurrent publish cannot make the author's response
   * describe someone else's write.
   *
   * Both sides of the comparison come out of the same sanitizer, so key order
   * matches and a string compare is enough — and a false "changed" only costs a
   * version number, where a false "same" would silently drop a real edit.
   */
  private async appendVersion(
    scope: PrivacyNoticeScope,
    scopeId: string,
    content: PrivacyNoticeContent | PrivacyNoticeAddendum,
  ): Promise<PrivacyNoticeVersion> {
    // Serializable: the version number is derived from the read, and
    // `@@unique([scope, scopeId, version])` turns two concurrent publishes into
    // a P2002 the author sees as a 500 — with no draft on the server to retry
    // from.
    return this.prisma.$transaction(
      async (tx) => {
        const latest = await this.latestVersion(scope, scopeId, tx);

        if (
          latest &&
          JSON.stringify(latest.content) === JSON.stringify(content)
        ) {
          return latest;
        }

        return tx.privacyNoticeVersion.create({
          data: {
            scope,
            scopeId,
            version: (latest?.version ?? 0) + 1,
            content,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async latestVersion(
    scope: PrivacyNoticeScope,
    scopeId: string,
    client: PrivacyNoticeClient = this.prisma,
  ) {
    return client.privacyNoticeVersion.findFirst({
      where: { scope, scopeId },
      orderBy: { version: 'desc' },
    });
  }

  private toOrganizationNotice(
    version: PrivacyNoticeVersion | null,
  ): OrganizationPrivacyNotice {
    return {
      content:
        (version?.content as PrivacyNoticeContent | undefined) ??
        emptyPrivacyNoticeContent(),
      publishedVersion: version?.version ?? null,
      publishedAt: version?.publishedAt.toISOString() ?? null,
    };
  }

  private toCampNotice(
    organizationVersion: PrivacyNoticeVersion | null,
    campVersion: PrivacyNoticeVersion | null,
  ): CampPrivacyNotice {
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
   * The free-text sections are HTML written by an organization administrator —
   * a less trusted author than the instance administrator behind
   * `LegalDocument`, so it is sanitized on the way in rather than trusted on
   * the way out.
   */
  private sanitizeContent(content: PrivacyNoticeContent): PrivacyNoticeContent {
    return {
      ...content,
      purposes: this.sanitizePurposes(content.purposes),
      dataCategories: this.sanitizeDataCategories(content.dataCategories),
      recipients: this.sanitizeRecipients(content.recipients),
      retention: content.retention && this.sanitizeRetention(content.retention),
      thirdCountryTransfers: this.sanitizeTransfers(
        content.thirdCountryTransfers,
      ),
      automatedDecisionMakingDetails: this.sanitizePlainTranslatable(
        content.automatedDecisionMakingDetails,
      ),
      additional: this.sanitizeTranslatable(content.additional),
      freeText: this.sanitizeTranslatable(content.freeText),
    };
  }

  /**
   * The addendum's subset of the same fields, authored by a camp manager. It
   * runs through the very same per-field helpers as the organization notice:
   * an author-written field that only one of the two sanitized would be a field
   * the other publishes raw.
   */
  private sanitizeAddendum(
    content: PrivacyNoticeAddendum,
  ): PrivacyNoticeAddendum {
    return {
      ...content,
      purposes: content.purposes && this.sanitizePurposes(content.purposes),
      dataCategories:
        content.dataCategories &&
        this.sanitizeDataCategories(content.dataCategories),
      recipients:
        content.recipients && this.sanitizeRecipients(content.recipients),
      retention: content.retention && this.sanitizeRetention(content.retention),
      thirdCountryTransfers:
        content.thirdCountryTransfers &&
        this.sanitizeTransfers(content.thirdCountryTransfers),
      additional: this.sanitizeTranslatable(content.additional),
    };
  }

  private sanitizePurposes(
    purposes: PrivacyPurposeEntry[],
  ): PrivacyPurposeEntry[] {
    return purposes.map((purpose) => ({
      ...purpose,
      legitimateInterest: this.sanitizePlainTranslatable(
        purpose.legitimateInterest,
      ),
      label: this.sanitizePlainTranslatable(purpose.label),
    }));
  }

  private sanitizeDataCategories(
    categories: PrivacyDataCategoryEntry[],
  ): PrivacyDataCategoryEntry[] {
    return categories.map((category) => ({
      ...category,
      label: this.sanitizePlainTranslatable(category.label),
    }));
  }

  private sanitizeRecipients(
    recipients: PrivacyRecipientEntry[],
  ): PrivacyRecipientEntry[] {
    return recipients.map((recipient) => ({
      ...recipient,
      name: recipient.name ? sanitizePlainText(recipient.name) : recipient.name,
    }));
  }

  private sanitizeRetention(retention: PrivacyRetention): PrivacyRetention {
    return {
      ...retention,
      exceptions: retentionExceptions(retention).map((exception) => ({
        ...exception,
        label: this.sanitizePlainTranslatable(exception.label),
        reason: this.sanitizePlainTranslatable(exception.reason),
      })),
    };
  }

  private sanitizeTransfers(
    transfers: PrivacyThirdCountryTransfers,
  ): PrivacyThirdCountryTransfers {
    return {
      ...transfers,
      note: this.sanitizePlainTranslatable(transfers.note),
    };
  }

  /** The rich-text sections, authored with the editor and rendered as HTML. */
  private sanitizeTranslatable(
    value: Translatable | null | undefined,
  ): Translatable | null {
    return this.mapTranslatable(value, sanitizeHtmlContent);
  }

  /** The sections written in a plain text field and rendered as text. */
  private sanitizePlainTranslatable(
    value: Translatable | null | undefined,
  ): Translatable | null {
    return this.mapTranslatable(value, sanitizePlainText);
  }

  private mapTranslatable(
    value: Translatable | null | undefined,
    sanitize: (text: string) => string,
  ): Translatable | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return sanitize(value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([locale, text]) => [locale, sanitize(text)]),
    );
  }
}
