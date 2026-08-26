import type { Translatable } from '../entities/Translatable.js';
import {
  emptyPrivacyNoticeContent,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyRetention,
  type PrivacyRetentionException,
  type PrivacyThirdCountryTransfers,
} from './content.js';
import type { SupervisoryAuthority } from './supervisoryAuthorities.js';

/**
 * An organization's notice with its event's additions folded in.
 *
 * The event's free text stays a field of its own rather than being concatenated
 * into `additional`: the two are authored by different people, and a reader
 * needs to see which statements come from the event.
 */
export interface ComposedPrivacyNotice extends PrivacyNoticeContent {
  eventAdditional: Translatable | null;
}

/**
 * What a registrant is served: the composed notice plus the two parts the
 * controller never authors — its own identity, taken from the organization
 * record, and the supervisory authority derived from its country.
 *
 * `notice` is null while the organization has published nothing.
 */
export interface PublishedPrivacyNotice {
  controller: {
    name: string;
    contactEmail: string;
    phone: string | null;
    website: string | null;
    addressStreet: string;
    addressZipCode: string;
    addressCity: string;
    country: string;
    registrationNumber: string | null;
  };
  supervisoryAuthority: SupervisoryAuthority | null;
  notice: ComposedPrivacyNotice | null;
  organizationVersion: number | null;
  eventVersion: number | null;
}

/**
 * Retention exceptions became a list after having been free text; a draft saved
 * before that must not crash the page that renders it.
 */
export function retentionExceptions(
  retention: PrivacyRetention | null | undefined,
): PrivacyRetentionException[] {
  return Array.isArray(retention?.exceptions) ? retention.exceptions : [];
}

/** Later entries win, so an event may restate an org entry with a different basis. */
function mergeByKey<T extends { key: string }>(base: T[], extra: T[]): T[] {
  const merged = new Map(base.map((entry) => [entry.key, entry]));
  for (const entry of extra) {
    merged.set(entry.key, entry);
  }
  return [...merged.values()];
}

/**
 * The event's period replaces the baseline, but its exceptions are added to the
 * organization's rather than replacing them: an event naming one statutory
 * exception must not silently drop everything its organization declared, and
 * the organization's later edits have to keep reaching events that added one.
 */
function mergeRetention(
  base: PrivacyRetention | null,
  event: PrivacyRetention | null | undefined,
): PrivacyRetention | null {
  if (!event) {
    return base;
  }

  const exceptions = new Map(
    retentionExceptions(base).map((exception) => [exception.scope, exception]),
  );
  for (const exception of retentionExceptions(event)) {
    exceptions.set(exception.scope, exception);
  }

  return {
    months: event.months,
    anchor: event.anchor,
    exceptions: [...exceptions.values()],
  };
}

/**
 * A event cannot undo a transfer its organization declared, so the countries are
 * a union and `enabled` is either side's; the event's safeguard and note win
 * only where it actually set them.
 */
function mergeTransfers(
  base: PrivacyThirdCountryTransfers,
  event: PrivacyThirdCountryTransfers | null | undefined,
): PrivacyThirdCountryTransfers {
  if (!event) {
    return base;
  }

  return {
    enabled: base.enabled || event.enabled,
    countries: [...new Set([...base.countries, ...event.countries])],
    safeguard: event.safeguard ?? base.safeguard ?? null,
    note: event.note ?? base.note ?? null,
  };
}

export function composePrivacyNotice(
  organization: PrivacyNoticeContent | null,
  event?: PrivacyNoticeAddendum | null,
): ComposedPrivacyNotice {
  const base = organization ?? emptyPrivacyNoticeContent();

  // The organization wrote its own prose, so there is no structure for an event's
  // structured entries to join, and the builder fields carry defaults nobody
  // authored. Emitting them would contradict the renderer, which shows the
  // prose alone. The event's own text still reaches the reader below.
  if (base.mode === 'free_text') {
    return {
      ...base,
      purposes: [],
      dataCategories: [],
      recipients: [],
      retention: null,
      thirdCountryTransfers: { enabled: false, countries: [] },
      eventAdditional: event?.additional ?? null,
    };
  }

  return {
    ...base,
    purposes: mergeByKey(base.purposes, event?.purposes ?? []),
    dataCategories: mergeByKey(
      base.dataCategories,
      event?.dataCategories ?? [],
    ),
    recipients: mergeByKey(base.recipients, event?.recipients ?? []),
    retention: mergeRetention(base.retention, event?.retention),
    thirdCountryTransfers: mergeTransfers(
      base.thirdCountryTransfers,
      event?.thirdCountryTransfers,
    ),
    eventAdditional: event?.additional ?? null,
  };
}
