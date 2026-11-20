import { describe, expect, it } from 'vitest';
import {
  addendumGaps,
  composePrivacyNotice,
  emptyPrivacyNoticeContent,
  hasStructuredEntries,
  normalizeExclusions,
  refusedExclusions,
  type PrivacyNoticeContent,
} from '../../src/privacy/index.js';

function organization(): PrivacyNoticeContent {
  return {
    ...emptyPrivacyNoticeContent(),
    purposes: [
      { key: 'registration_administration', legalBasis: 'contract' },
      { key: 'medical_care', legalBasis: 'contract' },
      { key: 'insurance', legalBasis: 'contract' },
    ],
    dataCategories: [
      { key: 'identity' },
      { key: 'health', specialCategoryBasis: 'explicit_consent' },
    ],
    recipients: [
      { key: 'event_staff' },
      { key: 'platform_operator' },
      { key: 'medical_provider' },
      { key: 'insurer', country: 'CH' },
    ],
    retention: {
      months: 24,
      anchor: 'event_end',
      exceptions: [{ scope: 'insurance', months: 120, anchor: 'event_end' }],
    },
    thirdCountryTransfers: {
      enabled: true,
      countries: ['CH', 'US'],
      safeguard: 'scc',
    },
  };
}

const keys = (entries: { key: string }[]) => entries.map((entry) => entry.key);

describe('composePrivacyNotice — exclusions', () => {
  it('removes excluded organization entries', () => {
    const composed = composePrivacyNotice(organization(), {
      excluded: {
        purposes: ['medical_care'],
        dataCategories: ['health'],
        recipients: ['medical_provider'],
      },
    });

    expect(keys(composed.purposes)).not.toContain('medical_care');
    expect(keys(composed.dataCategories)).not.toContain('health');
    expect(keys(composed.recipients)).not.toContain('medical_provider');
  });

  it('drops the retention exception scoped to an excluded purpose', () => {
    const composed = composePrivacyNotice(organization(), {
      excluded: { purposes: ['insurance'] },
    });

    expect(composed.retention?.exceptions).toEqual([]);
  });

  it('lets an event entry with the same key win over its exclusion', () => {
    const composed = composePrivacyNotice(organization(), {
      excluded: { dataCategories: ['health'] },
      dataCategories: [
        { key: 'health', specialCategoryBasis: 'vital_interests' },
      ],
    });

    expect(composed.dataCategories).toContainEqual({
      key: 'health',
      specialCategoryBasis: 'vital_interests',
    });
  });

  it('ignores exclusions of mandatory entries and always-recipients', () => {
    const content = organization();
    content.dataCategories[1] = {
      ...content.dataCategories[1],
      allEvents: true,
    };

    const composed = composePrivacyNotice(content, {
      excluded: {
        dataCategories: ['health'],
        recipients: ['platform_operator'],
      },
    });

    expect(keys(composed.dataCategories)).toContain('health');
    expect(keys(composed.recipients)).toContain('platform_operator');
  });

  it('keeps a transfer country a remaining recipient is located in', () => {
    const composed = composePrivacyNotice(organization(), {
      excluded: { transferCountries: ['CH', 'US'] },
    });

    expect(composed.thirdCountryTransfers.countries).toEqual(['CH']);
    expect(composed.thirdCountryTransfers.enabled).toBe(true);
  });

  it('compares transfer countries without regard to case', () => {
    const content = organization();
    content.thirdCountryTransfers.countries = ['ch', 'us'];
    content.recipients[3] = { key: 'insurer', country: 'ch' };

    const composed = composePrivacyNotice(content, {
      excluded: { transferCountries: ['CH', 'US'] },
    });

    // `ch` stays for the insurer located there; `us` goes.
    expect(composed.thirdCountryTransfers.countries).toEqual(['ch']);
    expect(
      refusedExclusions(content, { excluded: { transferCountries: ['ch'] } }),
    ).toEqual([
      { part: 'transferCountries', key: 'ch', reason: 'country_in_use' },
    ]);
    expect(
      normalizeExclusions(content, { excluded: { transferCountries: ['US'] } })
        .excluded?.transferCountries,
    ).toEqual(['us']);
  });

  it('ends the transfer once no country remains', () => {
    const composed = composePrivacyNotice(organization(), {
      excluded: { recipients: ['insurer'], transferCountries: ['CH', 'US'] },
    });

    expect(composed.thirdCountryTransfers).toMatchObject({
      enabled: false,
      countries: [],
      safeguard: null,
    });
  });

  it('composes an addendum without exclusions as before', () => {
    expect(composePrivacyNotice(organization(), {})).toEqual(
      composePrivacyNotice(organization(), { excluded: null }),
    );
  });
});

describe('normalizeExclusions', () => {
  it('drops undeclared and restated keys', () => {
    const normalized = normalizeExclusions(organization(), {
      excluded: {
        purposes: ['newsletter', 'medical_care'],
        recipients: ['transport_provider', 'medical_provider'],
      },
      recipients: [{ key: 'medical_provider', name: 'Camp doctor' }],
    });

    expect(normalized.excluded).toEqual({ purposes: ['medical_care'] });
  });

  it('clears exclusions that leave nothing', () => {
    const normalized = normalizeExclusions(organization(), {
      excluded: { purposes: ['newsletter'] },
    });

    expect(normalized.excluded).toBeNull();
  });
});

describe('refusedExclusions', () => {
  it('refuses mandatory entries, always-recipients and countries in use', () => {
    const content = organization();
    content.purposes[1] = { ...content.purposes[1], allEvents: true };

    expect(
      refusedExclusions(content, {
        excluded: {
          purposes: ['medical_care'],
          recipients: ['event_staff'],
          transferCountries: ['CH'],
        },
      }),
    ).toEqual([
      { part: 'purposes', key: 'medical_care', reason: 'all_events' },
      { part: 'recipients', key: 'event_staff', reason: 'always_recipient' },
      { part: 'transferCountries', key: 'CH', reason: 'country_in_use' },
    ]);
  });

  it('accepts a country once its recipient is excluded too', () => {
    expect(
      refusedExclusions(organization(), {
        excluded: { recipients: ['insurer'], transferCountries: ['CH'] },
      }),
    ).toEqual([]);
  });
});

describe('exclusions and completeness', () => {
  it('blocks excluding the last category with the existing gap', () => {
    expect(
      addendumGaps(organization(), {
        excluded: { dataCategories: ['identity', 'health'] },
      }),
    ).toContain('data_categories');
  });

  it('count as structured entries', () => {
    expect(
      hasStructuredEntries({ excluded: { purposes: ['medical_care'] } }),
    ).toBe(true);
  });
});
