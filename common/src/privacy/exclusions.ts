import {
  isAlwaysRecipient,
  type PrivacyDataCategoryRef,
  type PrivacyPurposeRef,
  type PrivacyRecipientRef,
} from './catalogue.js';
import type {
  PrivacyNoticeAddendum,
  PrivacyNoticeContent,
  PrivacyRecipientEntry,
} from './content.js';

/**
 * Organization entries an event drops from its notice. Excluding a purpose also
 * drops the retention exception scoped to it.
 */
export interface PrivacyNoticeExclusions {
  purposes?: PrivacyPurposeRef[];
  dataCategories?: PrivacyDataCategoryRef[];
  recipients?: PrivacyRecipientRef[];
  transferCountries?: string[];
}

/** An exclusion composition would ignore, and publishing therefore refuses. */
export type RefusedExclusion =
  | { part: 'purposes' | 'dataCategories'; key: string; reason: 'all_events' }
  | {
      part: 'recipients';
      key: string;
      reason: 'all_events' | 'always_recipient';
    }
  | { part: 'transferCountries'; key: string; reason: 'country_in_use' };

/** The exclusions composition honours, as sets. */
export interface AppliedExclusions {
  purposes: Set<string>;
  dataCategories: Set<string>;
  recipients: Set<string>;
  transferCountries: Set<string>;
}

interface Keyed {
  key: string;
  allEvents?: boolean | null;
}

function keysOf(entries: readonly { key: string }[] | undefined): Set<string> {
  return new Set((entries ?? []).map((entry) => entry.key));
}

/**
 * Keys the organization declares and the event does not restate. Anything else
 * is not an exclusion: an undeclared key hides nothing, and a restated one is an
 * override, which wins.
 */
function declaredAndInherited(
  excluded: readonly string[] | undefined,
  organization: readonly Keyed[],
  restated: readonly { key: string }[] | undefined,
): Keyed[] {
  const wanted = new Set(excluded ?? []);
  const own = keysOf(restated);

  return organization.filter(
    (entry) => wanted.has(entry.key) && !own.has(entry.key),
  );
}

function recipientExcludable(entry: PrivacyRecipientEntry): boolean {
  return !entry.allEvents && !isAlwaysRecipient(entry.key);
}

/** Countries a recipient left in the composed notice is located in. */
function countriesInUse(
  organization: PrivacyNoticeContent,
  addendum: PrivacyNoticeAddendum,
  excludedRecipients: Set<string>,
): Set<string> {
  const recipients = [
    ...organization.recipients.filter(
      (entry) => !excludedRecipients.has(entry.key),
    ),
    ...(addendum.recipients ?? []),
  ];

  return new Set(
    recipients
      .map((entry) => entry.country?.toUpperCase())
      .filter((country): country is string => !!country),
  );
}

/**
 * What composition actually removes. Mandatory entries, always-recipients and
 * countries a remaining recipient is located in are never removed, so a notice
 * cannot become false by construction — whatever an older addendum says.
 */
export function appliedExclusions(
  organization: PrivacyNoticeContent,
  addendum: PrivacyNoticeAddendum | null | undefined,
): AppliedExclusions {
  const excluded = addendum?.excluded;
  if (!addendum || !excluded) {
    return {
      purposes: new Set(),
      dataCategories: new Set(),
      recipients: new Set(),
      transferCountries: new Set(),
    };
  }

  const purposes = declaredAndInherited(
    excluded.purposes,
    organization.purposes,
    addendum.purposes,
  ).filter((entry) => !entry.allEvents);
  const dataCategories = declaredAndInherited(
    excluded.dataCategories,
    organization.dataCategories,
    addendum.dataCategories,
  ).filter((entry) => !entry.allEvents);
  const recipients = new Set(
    organization.recipients
      .filter(
        (entry) =>
          (excluded.recipients ?? []).includes(entry.key) &&
          !keysOf(addendum.recipients).has(entry.key) &&
          recipientExcludable(entry),
      )
      .map((entry) => entry.key),
  );

  // Countries are typed freely, so compared case-insensitively; the result
  // holds the organization's own spelling, which composition filters by.
  const inUse = countriesInUse(organization, addendum, recipients);
  const wanted = new Set(
    (excluded.transferCountries ?? []).map((country) => country.toUpperCase()),
  );
  const transferCountries = new Set(
    organization.thirdCountryTransfers.countries.filter((country) => {
      const code = country.toUpperCase();
      return wanted.has(code) && !inUse.has(code);
    }),
  );

  return {
    purposes: keysOf(purposes),
    dataCategories: keysOf(dataCategories),
    recipients,
    transferCountries,
  };
}

/**
 * The exclusions publishing refuses: those composition would ignore. Run on a
 * normalized addendum, so undeclared and restated keys are already gone.
 */
export function refusedExclusions(
  organization: PrivacyNoticeContent | null,
  addendum: PrivacyNoticeAddendum,
): RefusedExclusion[] {
  const excluded = addendum.excluded;
  if (!organization || !excluded) {
    return [];
  }

  const refused: RefusedExclusion[] = [];

  for (const entry of declaredAndInherited(
    excluded.purposes,
    organization.purposes,
    addendum.purposes,
  )) {
    if (entry.allEvents) {
      refused.push({ part: 'purposes', key: entry.key, reason: 'all_events' });
    }
  }

  for (const entry of declaredAndInherited(
    excluded.dataCategories,
    organization.dataCategories,
    addendum.dataCategories,
  )) {
    if (entry.allEvents) {
      refused.push({
        part: 'dataCategories',
        key: entry.key,
        reason: 'all_events',
      });
    }
  }

  const wantedRecipients = new Set(excluded.recipients ?? []);
  for (const entry of organization.recipients) {
    if (!wantedRecipients.has(entry.key)) {
      continue;
    }
    if (isAlwaysRecipient(entry.key)) {
      refused.push({
        part: 'recipients',
        key: entry.key,
        reason: 'always_recipient',
      });
    } else if (entry.allEvents) {
      refused.push({
        part: 'recipients',
        key: entry.key,
        reason: 'all_events',
      });
    }
  }

  const applied = appliedExclusions(organization, addendum);
  const inUse = countriesInUse(organization, addendum, applied.recipients);
  for (const country of excluded.transferCountries ?? []) {
    if (inUse.has(country.toUpperCase())) {
      refused.push({
        part: 'transferCountries',
        key: country,
        reason: 'country_in_use',
      });
    }
  }

  return refused;
}

/**
 * Drops exclusions of keys the organization does not declare and of keys the
 * event restates. An entry the organization adds later is therefore inherited,
 * never silently hidden — over-declaring is the safe failure.
 */
export function normalizeExclusions(
  organization: PrivacyNoticeContent | null,
  addendum: PrivacyNoticeAddendum,
): PrivacyNoticeAddendum {
  const excluded = addendum.excluded;
  if (!excluded) {
    return addendum;
  }

  if (!organization || organization.mode === 'free_text') {
    return { ...addendum, excluded: null };
  }

  const keep = (
    keys: readonly string[] | undefined,
    declared: Set<string>,
    restated: Set<string>,
  ) =>
    [...new Set(keys ?? [])].filter(
      (key) => declared.has(key) && !restated.has(key),
    );

  const normalized: PrivacyNoticeExclusions = {
    purposes: keep(
      excluded.purposes,
      keysOf(organization.purposes),
      keysOf(addendum.purposes),
    ) as PrivacyPurposeRef[],
    dataCategories: keep(
      excluded.dataCategories,
      keysOf(organization.dataCategories),
      keysOf(addendum.dataCategories),
    ) as PrivacyDataCategoryRef[],
    recipients: keep(
      excluded.recipients,
      keysOf(organization.recipients),
      keysOf(addendum.recipients),
    ) as PrivacyRecipientRef[],
    // In the organization's spelling: countries are typed freely.
    transferCountries: [
      ...new Set(
        (excluded.transferCountries ?? []).flatMap((country) =>
          organization.thirdCountryTransfers.countries.filter(
            (declared) => declared.toUpperCase() === country.toUpperCase(),
          ),
        ),
      ),
    ],
  };

  return { ...addendum, excluded: compact(normalized) };
}

/** The addendum without the exclusions `refusedExclusions` reported. */
export function withoutRefused(
  addendum: PrivacyNoticeAddendum,
  refused: readonly RefusedExclusion[],
): PrivacyNoticeAddendum {
  const excluded = addendum.excluded;
  if (!excluded || refused.length === 0) {
    return addendum;
  }

  const drop = (part: RefusedExclusion['part'], keys?: readonly string[]) =>
    keys?.filter(
      (key) =>
        !refused.some((entry) => entry.part === part && entry.key === key),
    );

  return {
    ...addendum,
    excluded: compact({
      purposes: drop('purposes', excluded.purposes) as PrivacyPurposeRef[],
      dataCategories: drop(
        'dataCategories',
        excluded.dataCategories,
      ) as PrivacyDataCategoryRef[],
      recipients: drop(
        'recipients',
        excluded.recipients,
      ) as PrivacyRecipientRef[],
      transferCountries: drop('transferCountries', excluded.transferCountries),
    }),
  };
}

/** Drops empty parts; null when nothing is excluded at all. */
function compact(
  excluded: PrivacyNoticeExclusions,
): PrivacyNoticeExclusions | null {
  const parts = Object.entries(excluded).filter(
    ([, keys]) => Array.isArray(keys) && keys.length > 0,
  );

  return parts.length > 0 ? Object.fromEntries(parts) : null;
}
