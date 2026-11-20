import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#core/router/ApiError';
import { perRequest } from '#core/context/requestContext';
import { localesForCountries } from '@camp-registration/common/locales';
import { sanitizeHtmlContent, sanitizePlainText } from '#utils/sanitize';
import {
  addendumGaps,
  composePrivacyNotice,
  emptyPrivacyNoticeContent,
  hasStructuredEntries,
  isEmptyAddendum,
  normalizeExclusions,
  privacyNoticeCompleteness,
  publishableAddendum,
  refusedExclusions,
  retentionExceptions,
  supervisoryAuthorityFor,
  withoutRefused,
  type ComposedPrivacyNotice,
  type EventPrivacyNotice,
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
  eventPrivacyNoticeVersionId: string | null;
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

    return this.toOrganizationNotice(
      published,
      await this.organizationLocales(organizationId),
    );
  }

  /**
   * The only write. Publishing deliberately leaves `verificationStatus` alone:
   * demoting the organization would pull its live events into a pending state
   * and teach everyone not to touch the notice again.
   */
  async publishOrganizationNotice(
    organizationId: string,
    content: PrivacyNoticeContent,
  ): Promise<OrganizationPrivacyNotice> {
    const sanitized = this.sanitizeContent(content);
    const locales = await this.organizationLocales(organizationId);
    const completeness = privacyNoticeCompleteness(sanitized, { locales });

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

    return this.toOrganizationNotice(published, locales);
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
   * The event's published addendum together with the organization notice it is
   * added to — the editor has to show an author what their organization already
   * says before it can show what the event adds to it.
   */
  async getEventAddendum(
    eventId: string,
    organizationId: string,
  ): Promise<EventPrivacyNotice> {
    const [organizationVersion, eventVersion] = await Promise.all([
      this.latestVersion('ORGANIZATION', organizationId),
      this.latestVersion('EVENT', eventId),
    ]);

    return this.toEventNotice(
      organizationVersion,
      eventVersion,
      await this.eventLocales(eventId),
    );
  }

  /**
   * Saying nothing stays free: an addendum is optional by nature, and a event
   * that has nothing to add says so by adding nothing. An empty addendum is
   * refused as a first version — it would say the same as no version at all —
   * but accepted once a version exists, because withdrawing every addition is
   * the only way back to the organization's notice on its own. The withdrawal
   * is a version of its own rather than a deletion: registrations are stamped
   * with the version they were shown, so no version may disappear.
   *
   * Saying something, however, is checked exactly as the organization's notice
   * is. The gate runs on the composed document rather than the addendum alone,
   * because the composed document is what a registrant reads: a event adding
   * `health` owes an Art. 9 basis for it no matter what its organization
   * declared. Only the gaps the addendum itself opens are refused — see
   * `addendumGaps`.
   */
  async publishEventAddendum(
    eventId: string,
    organizationId: string,
    content: PrivacyNoticeAddendum,
  ): Promise<EventPrivacyNotice> {
    const sanitized = this.sanitizeAddendum(content);
    const locales = await this.eventLocales(eventId);
    const organizationVersion = await this.latestVersion(
      'ORGANIZATION',
      organizationId,
    );
    const organizationContent =
      (organizationVersion?.content as PrivacyNoticeContent | undefined) ??
      null;

    // Composition drops structured entries under a free-text notice, so
    // accepting them would publish statements no registrant is shown.
    if (
      organizationContent?.mode === 'free_text' &&
      hasStructuredEntries(sanitized)
    ) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        'The organization notice is free text; an event can only add text to it.',
      );
    }

    // Undeclared and restated keys hide nothing, so they are dropped rather
    // than stored for a later organization entry to vanish under.
    const addendum = normalizeExclusions(organizationContent, sanitized);

    // Composition would ignore these; publishing them would mislead the author.
    const refused = refusedExclusions(organizationContent, addendum);
    if (refused.length > 0) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        `These entries cannot be excluded: ${refused
          .map((entry) => `${entry.part}.${entry.key} (${entry.reason})`)
          .join(', ')}`,
      );
    }

    if (isEmptyAddendum(addendum)) {
      if (!(await this.latestVersion('EVENT', eventId))) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          'Privacy notice addendum is empty.',
        );
      }
    } else {
      const gaps = addendumGaps(organizationContent, addendum, { locales });

      if (gaps.length > 0) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Privacy notice addendum is incomplete: ${gaps.join(', ')}`,
        );
      }
    }

    const eventVersion = await this.appendVersion('EVENT', eventId, addendum);

    return this.toEventNotice(organizationVersion, eventVersion, locales);
  }

  /**
   * What a registrant is served. Reads the published versions, so an edit still
   * open in an author's browser cannot change what the public page says.
   */
  async getPublishedNotice(
    eventId: string,
    organizationId: string,
  ): Promise<PublishedPrivacyNotice> {
    const [organization, organizationVersion, eventVersion] = await Promise.all(
      [
        this.prisma.organization.findUniqueOrThrow({
          where: { id: organizationId },
        }),
        this.latestVersion('ORGANIZATION', organizationId),
        this.latestVersion('EVENT', eventId),
      ],
    );

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
      notice: composeVersions(organizationVersion, eventVersion),
      organizationVersion: organizationVersion?.version ?? null,
      eventVersion: eventVersion?.version ?? null,
    };
  }

  /**
   * Copies a reference event's addendum onto a freshly created event, for
   * event cloning. Best-effort: a source with nothing published, or only a
   * withdrawn (empty) version, leaves the new event without one — same as if
   * it had never been asked to clone one. A source whose content the new
   * event's organization notice doesn't fully cover is skipped rather than
   * failing the event creation it's part of; the author can always author
   * their own addendum afterwards.
   */
  async copyEventAddendum(
    fromEventId: string,
    toEventId: string,
    toOrganizationId: string,
  ): Promise<void> {
    const eventVersion = await this.latestVersion('EVENT', fromEventId);
    const source = eventVersion?.content as PrivacyNoticeAddendum | undefined;

    if (!source) {
      return;
    }

    const organizationVersion = await this.latestVersion(
      'ORGANIZATION',
      toOrganizationId,
    );
    const organizationContent =
      (organizationVersion?.content as PrivacyNoticeContent | undefined) ??
      null;
    // Under a free-text target notice only the source's text can be shown.
    // Exclusions are re-read against the target organization; any it would
    // ignore are dropped, since cloning must not fail on them.
    const normalized = normalizeExclusions(
      organizationContent,
      publishableAddendum(organizationContent, source),
    );
    const refused = refusedExclusions(organizationContent, normalized);
    const content = withoutRefused(normalized, refused);

    if (isEmptyAddendum(content)) {
      return;
    }

    const gaps = addendumGaps(organizationContent, content);

    if (gaps.length > 0) {
      return;
    }

    await this.appendVersion(
      'EVENT',
      toEventId,
      this.sanitizeAddendum(content),
    );
  }

  /** The notice registrants currently read, or null before any is published. */
  async getComposedNotice(
    eventId: string,
    organizationId: string,
  ): Promise<ComposedPrivacyNotice | null> {
    const [organizationVersion, eventVersion] = await Promise.all([
      this.latestVersion('ORGANIZATION', organizationId),
      this.latestVersion('EVENT', eventId),
    ]);

    return composeVersions(organizationVersion, eventVersion);
  }

  /**
   * What a registrant submitting now is shown, resolved once per registration:
   * the stamp stored with it, and the composed notice its consents are checked
   * against — the same versions, so the check and the proof agree. Read once
   * per request: the route's compliance guard and the create share it.
   */
  getNoticeForRegistration(
    eventId: string,
    organizationId: string,
  ): Promise<{
    stamp: PrivacyNoticeStamp;
    notice: ComposedPrivacyNotice | null;
  }> {
    return perRequest(`registration-notice:${eventId}`, async () => {
      const [organizationVersion, eventVersion, platformPolicy] =
        await Promise.all([
          this.latestVersion('ORGANIZATION', organizationId),
          this.latestVersion('EVENT', eventId),
          this.legalService.getDocument('PRIVACY_POLICY'),
        ]);

      return {
        stamp: {
          organizationPrivacyNoticeVersionId: organizationVersion?.id ?? null,
          eventPrivacyNoticeVersionId: eventVersion?.id ?? null,
          platformPrivacyPolicyUpdatedAt: platformPolicy.updatedAt ?? null,
        },
        notice: composeVersions(organizationVersion, eventVersion),
      };
    });
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
    return this.transaction(
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

  /** The locales an event is offered in, which its notice must be read in. */
  private async eventLocales(eventId: string): Promise<string[]> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { countries: true },
    });

    return event ? localesForCountries(event.countries) : [];
  }

  /**
   * Every locale one of the organization's events is offered in: its notice
   * is shown with each of them (Art. 12). None yet means any locale will do.
   */
  private async organizationLocales(organizationId: string): Promise<string[]> {
    const events = await this.prisma.event.findMany({
      where: { organizationId },
      select: { countries: true },
    });

    return localesForCountries(events.flatMap((event) => event.countries));
  }

  private toOrganizationNotice(
    version: PrivacyNoticeVersion | null,
    requiredLocales: string[],
  ): OrganizationPrivacyNotice {
    return {
      requiredLocales,
      content:
        (version?.content as PrivacyNoticeContent | undefined) ??
        emptyPrivacyNoticeContent(),
      publishedVersion: version?.version ?? null,
      publishedAt: version?.publishedAt.toISOString() ?? null,
    };
  }

  private toEventNotice(
    organizationVersion: PrivacyNoticeVersion | null,
    eventVersion: PrivacyNoticeVersion | null,
    requiredLocales: string[],
  ): EventPrivacyNotice {
    return {
      requiredLocales,
      content:
        (eventVersion?.content as PrivacyNoticeAddendum | undefined) ?? {},
      organizationContent:
        (organizationVersion?.content as PrivacyNoticeContent | undefined) ??
        null,
      organizationPublishedVersion: organizationVersion?.version ?? null,
      organizationPublishedAt:
        organizationVersion?.publishedAt.toISOString() ?? null,
      publishedVersion: eventVersion?.version ?? null,
      publishedAt: eventVersion?.publishedAt.toISOString() ?? null,
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
   * The addendum's subset of the same fields, authored by a event manager. It
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
      label: this.sanitizePlainTranslatable(recipient.label),
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

/** The notice registrants read, or null before the organization published. */
function composeVersions(
  organizationVersion: PrivacyNoticeVersion | null,
  eventVersion: PrivacyNoticeVersion | null,
): ComposedPrivacyNotice | null {
  return organizationVersion
    ? composePrivacyNotice(
        organizationVersion.content as PrivacyNoticeContent,
        eventVersion?.content as PrivacyNoticeAddendum | undefined,
      )
    : null;
}
