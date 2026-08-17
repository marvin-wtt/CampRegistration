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
 * An organization's notice with its camp's additions folded in.
 *
 * The camp's free text stays a field of its own rather than being concatenated
 * into `additional`: the two are authored by different people, and a reader
 * needs to see which statements come from the camp.
 */
export interface ComposedPrivacyNotice extends PrivacyNoticeContent {
  campAdditional: Translatable | null;
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
  campVersion: number | null;
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

/** Later entries win, so a camp may restate an org entry with a different basis. */
function mergeByKey<T extends { key: string }>(base: T[], extra: T[]): T[] {
  const merged = new Map(base.map((entry) => [entry.key, entry]));
  for (const entry of extra) {
    merged.set(entry.key, entry);
  }
  return [...merged.values()];
}

/**
 * The camp's period replaces the baseline, but its exceptions are added to the
 * organization's rather than replacing them: a camp naming one statutory
 * exception must not silently drop everything its organization declared, and
 * the organization's later edits have to keep reaching camps that added one.
 */
function mergeRetention(
  base: PrivacyRetention | null,
  camp: PrivacyRetention | null | undefined,
): PrivacyRetention | null {
  if (!camp) {
    return base;
  }

  const exceptions = new Map(
    retentionExceptions(base).map((exception) => [exception.scope, exception]),
  );
  for (const exception of retentionExceptions(camp)) {
    exceptions.set(exception.scope, exception);
  }

  return {
    months: camp.months,
    anchor: camp.anchor,
    exceptions: [...exceptions.values()],
  };
}

/**
 * A camp cannot undo a transfer its organization declared, so the countries are
 * a union and `enabled` is either side's; the camp's safeguard and note win
 * only where it actually set them.
 */
function mergeTransfers(
  base: PrivacyThirdCountryTransfers,
  camp: PrivacyThirdCountryTransfers | null | undefined,
): PrivacyThirdCountryTransfers {
  if (!camp) {
    return base;
  }

  return {
    enabled: base.enabled || camp.enabled,
    countries: [...new Set([...base.countries, ...camp.countries])],
    safeguard: camp.safeguard ?? base.safeguard ?? null,
    note: camp.note ?? base.note ?? null,
  };
}

export function composePrivacyNotice(
  organization: PrivacyNoticeContent | null,
  camp?: PrivacyNoticeAddendum | null,
): ComposedPrivacyNotice {
  const base = organization ?? emptyPrivacyNoticeContent();

  // The organization wrote its own prose, so there is no structure for a camp's
  // structured entries to join, and the builder fields carry defaults nobody
  // authored. Emitting them would contradict the renderer, which shows the
  // prose alone. The camp's own text still reaches the reader below.
  if (base.mode === 'free_text') {
    return {
      ...base,
      purposes: [],
      dataCategories: [],
      recipients: [],
      retention: null,
      thirdCountryTransfers: { enabled: false, countries: [] },
      campAdditional: camp?.additional ?? null,
    };
  }

  return {
    ...base,
    purposes: mergeByKey(base.purposes, camp?.purposes ?? []),
    dataCategories: mergeByKey(base.dataCategories, camp?.dataCategories ?? []),
    recipients: mergeByKey(base.recipients, camp?.recipients ?? []),
    retention: mergeRetention(base.retention, camp?.retention),
    thirdCountryTransfers: mergeTransfers(
      base.thirdCountryTransfers,
      camp?.thirdCountryTransfers,
    ),
    campAdditional: camp?.additional ?? null,
  };
}
