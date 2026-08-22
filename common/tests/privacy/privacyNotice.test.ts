import { describe, expect, it } from 'vitest';
import {
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_PURPOSE_PRESETS,
  PRIVACY_RECIPIENT_KEYS,
  SPECIAL_CATEGORY_DATA_KEYS,
  addendumGaps,
  composePrivacyNotice,
  customKey,
  emptyPrivacyNoticeContent,
  gapsInSection,
  isEmptyAddendum,
  privacyNoticeCompleteness,
  supervisoryAuthorityFor,
  type PrivacyNoticeContent,
} from '../../src/privacy/index.js';

function completeContent(): PrivacyNoticeContent {
  return {
    ...emptyPrivacyNoticeContent(),
    purposes: [{ key: 'registration_administration', legalBasis: 'contract' }],
    dataCategories: [{ key: 'identity' }],
    recipients: [{ key: 'platform_operator' }],
    retention: { months: 24, anchor: 'camp_end', exceptions: [] },
  };
}

describe('privacyNoticeCompleteness', () => {
  it('reports every core gap for a missing notice', () => {
    const result = privacyNoticeCompleteness(null);

    expect(result.complete).toBe(false);
    expect(result.gaps).toEqual([
      'purposes',
      'data_categories',
      'recipients',
      'retention',
    ]);
  });

  it('accepts a minimal but complete notice', () => {
    expect(privacyNoticeCompleteness(completeContent())).toEqual({
      complete: true,
      gaps: [],
    });
  });

  it('requires an Art. 9 basis for special category data', () => {
    const content = completeContent();
    content.dataCategories.push({ key: 'health' });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'special_category_basis',
    );

    content.dataCategories = [
      { key: 'identity' },
      { key: 'health', specialCategoryBasis: 'explicit_consent' },
    ];

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('does not treat dietary requirements as special category data', () => {
    // "Vegetarian" or "lactose intolerant" reveals nothing under Art. 9; only a
    // form that captures halal/kosher or allergies does, and that is modelled by
    // also selecting `religion` or `allergies`.
    const content = completeContent();
    content.dataCategories.push({ key: 'dietary' });

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('still requires a basis for the categories that are always special', () => {
    for (const key of SPECIAL_CATEGORY_DATA_KEYS) {
      const content = completeContent();
      content.dataCategories.push({ key });

      expect(privacyNoticeCompleteness(content).gaps).toContain(
        'special_category_basis',
      );
    }
  });

  it('requires the interest to be named when relying on it', () => {
    const content = completeContent();
    content.purposes = [
      { key: 'photo_documentation', legalBasis: 'legitimate_interests' },
    ];

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'legitimate_interest_explanation',
    );

    content.purposes[0]!.legitimateInterest = { en: 'Documenting camp life' };

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('ignores a blank translation when checking free text', () => {
    const content = completeContent();
    content.purposes = [
      {
        key: 'photo_documentation',
        legalBasis: 'legitimate_interests',
        legitimateInterest: { en: '   ' },
      },
    ];

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'legitimate_interest_explanation',
    );
  });

  it('requires countries and a safeguard once transfers are declared', () => {
    const content = completeContent();
    content.thirdCountryTransfers = { enabled: true, countries: [] };

    const gaps = privacyNoticeCompleteness(content).gaps;
    expect(gaps).toContain('transfer_countries');
    expect(gaps).toContain('transfer_safeguard');
  });

  it('rejects a non-positive retention period', () => {
    const content = completeContent();
    content.retention = { months: 0, anchor: 'camp_end', exceptions: [] };

    expect(privacyNoticeCompleteness(content).gaps).toContain('retention');
  });

  it('accepts a baseline with no exceptions at all', () => {
    // The common camp never categorises anything.
    expect(privacyNoticeCompleteness(completeContent()).complete).toBe(true);
  });

  it('accepts an exception scoped to a purpose from the catalogue', () => {
    const content = completeContent();
    content.retention!.exceptions = [
      { scope: 'payment_and_invoicing', months: 120, anchor: 'camp_end' },
    ];

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('requires a name for an exception the author invented', () => {
    const content = completeContent();
    content.retention!.exceptions = [
      { scope: customKey('1'), months: 36, anchor: 'camp_end' },
    ];

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'retention_exception',
    );

    content.retention!.exceptions[0]!.label = { en: 'Accident reports' };
    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('rejects an exception with no period', () => {
    const content = completeContent();
    content.retention!.exceptions = [
      { scope: 'insurance', months: 0, anchor: 'camp_end' },
    ];

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'retention_exception',
    );
  });

  it('tolerates a draft saved before exceptions became a list', () => {
    const content = completeContent();
    content.retention = {
      months: 24,
      anchor: 'camp_end',
      // @ts-expect-error legacy shape: exceptions used to be free text
      exceptions: { en: 'Tax records' },
    };

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });
});

describe('privacyNoticeCompleteness — free text mode', () => {
  it('checks only that there is text', () => {
    const content: PrivacyNoticeContent = {
      ...emptyPrivacyNoticeContent(),
      mode: 'free_text',
    };

    expect(privacyNoticeCompleteness(content).gaps).toEqual(['free_text']);

    content.freeText = { en: '<p>Our notice.</p>' };

    // None of the structural rules apply once the organization wrote its own.
    expect(privacyNoticeCompleteness(content)).toEqual({
      complete: true,
      gaps: [],
    });
  });
});

describe('privacyNoticeCompleteness — custom entries', () => {
  it('requires a name for a custom category', () => {
    const content = completeContent();
    content.dataCategories.push({ key: customKey('abc') });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'custom_category_label',
    );

    content.dataCategories[1]!.label = { en: 'Swimming ability' };

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('requires an Art. 9 basis for a custom category flagged special', () => {
    const content = completeContent();
    content.dataCategories.push({
      key: customKey('abc'),
      label: { en: 'Criminal record check' },
      special: true,
    });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'special_category_basis',
    );
  });

  it('requires a name for a custom purpose', () => {
    const content = completeContent();
    content.purposes.push({ key: customKey('xyz'), legalBasis: 'contract' });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'custom_purpose_label',
    );
  });
});

describe('privacyNoticeCompleteness — Art. 13(2)(f)', () => {
  it('requires the logic to be explained once automated decisions are declared', () => {
    const content = completeContent();
    content.automatedDecisionMaking = true;

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'automated_details',
    );

    content.automatedDecisionMakingDetails = {
      en: 'Waiting-list places are allocated by submission time.',
    };

    expect(privacyNoticeCompleteness(content).complete).toBe(true);
  });

  it('says nothing about the logic when there are no automated decisions', () => {
    const content = completeContent();
    content.automatedDecisionMaking = false;
    content.automatedDecisionMakingDetails = null;

    expect(privacyNoticeCompleteness(content).gaps).not.toContain(
      'automated_details',
    );
  });
});

describe('privacyNoticeCompleteness — data protection officer', () => {
  it('rejects a named officer with no contact details', () => {
    const content = completeContent();
    content.dpo = { name: 'Jane Doe', email: '' };

    expect(privacyNoticeCompleteness(content).gaps).toContain('dpo_details');
  });
});

describe('gapsInSection', () => {
  it('routes every gap to the step that can fix it', () => {
    const content = emptyPrivacyNoticeContent();
    const { gaps } = privacyNoticeCompleteness(content);

    expect(gapsInSection(gaps, 'data')).toEqual(['data_categories']);
    expect(gapsInSection(gaps, 'purposes')).toEqual(['purposes']);
    // A fresh notice already carries the recipients that exist by construction
    // and a default retention period, so neither of those gaps can fire.
    expect(gapsInSection(gaps, 'recipients')).toEqual([]);
    expect(gapsInSection(gaps, 'retention')).toEqual([]);
  });
});

describe('the catalogue', () => {
  it('keeps every special category inside the category list', () => {
    for (const key of SPECIAL_CATEGORY_DATA_KEYS) {
      expect(PRIVACY_DATA_CATEGORY_KEYS).toContain(key);
    }
  });

  it('only presets purposes with catalogue keys', () => {
    for (const preset of Object.values(PRIVACY_PURPOSE_PRESETS)) {
      for (const key of preset.dataCategories) {
        expect(PRIVACY_DATA_CATEGORY_KEYS).toContain(key);
      }
      for (const key of preset.recipients) {
        expect(PRIVACY_RECIPIENT_KEYS).toContain(key);
      }
    }
  });

  it('has a preset for every purpose', () => {
    for (const key of PRIVACY_PURPOSE_KEYS) {
      expect(PRIVACY_PURPOSE_PRESETS[key]).toBeDefined();
    }
  });
});

describe('isEmptyAddendum', () => {
  it('should treat a missing and an empty-listed addendum alike', () => {
    expect(isEmptyAddendum({})).toBe(true);
    expect(
      isEmptyAddendum({ dataCategories: [], recipients: [], additional: null }),
    ).toBe(true);
  });

  it('should see any single statement of the camp', () => {
    expect(isEmptyAddendum({ dataCategories: [{ key: 'photos' }] })).toBe(
      false,
    );
    expect(isEmptyAddendum({ recipients: [{ key: 'insurer' }] })).toBe(false);
    expect(isEmptyAddendum({ additional: { en: '<p>Bus company</p>' } })).toBe(
      false,
    );
    expect(
      isEmptyAddendum({
        retention: { months: 12, anchor: 'camp_end', exceptions: [] },
      }),
    ).toBe(false);
  });
});

describe('composePrivacyNotice', () => {
  it('merges the camp addendum into the organization notice', () => {
    const composed = composePrivacyNotice(completeContent(), {
      purposes: [{ key: 'photo_publication', legalBasis: 'consent' }],
      recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      additional: { en: 'Photos are published in the parent newsletter.' },
    });

    expect(composed.purposes.map((p) => p.key)).toEqual([
      'registration_administration',
      'photo_publication',
    ]);
    expect(composed.recipients).toHaveLength(2);
    expect(composed.campAdditional).toEqual({
      en: 'Photos are published in the parent newsletter.',
    });
  });

  it('lets the camp restate an organization entry', () => {
    const composed = composePrivacyNotice(completeContent(), {
      purposes: [
        { key: 'registration_administration', legalBasis: 'legal_obligation' },
      ],
      retention: { months: 6, anchor: 'submission', exceptions: [] },
    });

    expect(composed.purposes).toEqual([
      { key: 'registration_administration', legalBasis: 'legal_obligation' },
    ]);
    expect(composed.retention).toEqual({
      months: 6,
      anchor: 'submission',
      exceptions: [],
    });
  });

  it('adds the camp exceptions to the organization ones', () => {
    const organization: PrivacyNoticeContent = {
      ...completeContent(),
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
    };

    const composed = composePrivacyNotice(organization, {
      retention: {
        months: 6,
        anchor: 'submission',
        exceptions: [
          { scope: 'photo_publication', months: 36, anchor: 'camp_end' },
        ],
      },
    });

    // The camp names one exception; the statutory one its organization declared
    // must survive, or the notice quietly understates how long data is kept.
    expect(composed.retention?.exceptions.map((e) => e.scope)).toEqual([
      'payment_and_invoicing',
      'photo_publication',
    ]);
    expect(composed.retention?.months).toBe(6);
  });

  it('lets the camp restate an exception the organization already made', () => {
    const organization: PrivacyNoticeContent = {
      ...completeContent(),
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
    };

    const composed = composePrivacyNotice(organization, {
      retention: {
        months: 24,
        anchor: 'camp_end',
        exceptions: [
          { scope: 'payment_and_invoicing', months: 84, anchor: 'camp_end' },
        ],
      },
    });

    expect(composed.retention?.exceptions).toEqual([
      { scope: 'payment_and_invoicing', months: 84, anchor: 'camp_end' },
    ]);
  });

  it('unions the third country transfers rather than replacing them', () => {
    const organization: PrivacyNoticeContent = {
      ...completeContent(),
      thirdCountryTransfers: {
        enabled: true,
        countries: ['US'],
        safeguard: 'adequacy',
        note: null,
      },
    };

    const composed = composePrivacyNotice(organization, {
      thirdCountryTransfers: { enabled: true, countries: ['CH'] },
    });

    // A camp cannot un-declare a transfer its organization makes.
    expect(composed.thirdCountryTransfers.countries).toEqual(['US', 'CH']);
    expect(composed.thirdCountryTransfers.safeguard).toBe('adequacy');
  });

  it('keeps the organization values when the camp adds nothing', () => {
    const organization = completeContent();
    const composed = composePrivacyNotice(organization, null);

    expect(composed.retention).toEqual(organization.retention);
    expect(composed.campAdditional).toBeNull();
  });

  it('degrades to an empty notice when the organization has none', () => {
    expect(composePrivacyNotice(null).purposes).toEqual([]);
  });
});

describe('composePrivacyNotice — free text mode', () => {
  function freeTextContent(): PrivacyNoticeContent {
    return {
      ...completeContent(),
      mode: 'free_text',
      freeText: { en: '<p>We keep it short.</p>' },
    };
  }

  it('emits the prose alone, without the builder fields', () => {
    const composed = composePrivacyNotice(freeTextContent());

    // The builder values are defaults nobody authored, and the renderer shows
    // none of them in this mode — carrying them would only invite a reader of
    // the API to believe the organization declared them.
    expect(composed.freeText).toEqual({ en: '<p>We keep it short.</p>' });
    expect(composed.purposes).toEqual([]);
    expect(composed.dataCategories).toEqual([]);
    expect(composed.recipients).toEqual([]);
    expect(composed.retention).toBeNull();
    expect(composed.thirdCountryTransfers.enabled).toBe(false);
  });

  it('drops a camp structured addition but keeps its prose', () => {
    const composed = composePrivacyNotice(freeTextContent(), {
      recipients: [{ key: 'transport_provider', name: 'Bus Co' }],
      additional: { en: 'We also use a coach company.' },
    });

    expect(composed.recipients).toEqual([]);
    expect(composed.campAdditional).toEqual({
      en: 'We also use a coach company.',
    });
  });
});

describe('supervisoryAuthorityFor', () => {
  it('resolves a country code case-insensitively', () => {
    expect(supervisoryAuthorityFor('cz')?.name).toBe(
      'Úřad pro ochranu osobních údajů',
    );
  });

  it('flags Germany as regional, since the Land authority is competent', () => {
    expect(supervisoryAuthorityFor('DE')?.regional).toBe(true);
  });

  it('returns null outside the covered countries', () => {
    expect(supervisoryAuthorityFor('US')).toBeNull();
  });
});

describe('privacyNoticeCompleteness — consent-bound retention', () => {
  it('accepts an exception with no period when it runs until withdrawal', () => {
    const content = completeContent();
    content.purposes.push({ key: 'photo_publication', legalBasis: 'consent' });
    content.retention!.exceptions.push({
      scope: 'photo_publication',
      until: 'consent_withdrawn',
    });

    expect(privacyNoticeCompleteness(content)).toEqual({
      complete: true,
      gaps: [],
    });
  });

  it('refuses indefinite retention hung on a purpose that is not consent', () => {
    const content = completeContent();
    content.retention!.exceptions.push({
      scope: 'registration_administration',
      until: 'consent_withdrawn',
    });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'retention_exception_consent_basis',
    );
  });

  it('still requires a name for a consent-bound exception the author invented', () => {
    const content = completeContent();
    content.purposes.push({ key: customKey('1'), legalBasis: 'consent' });
    content.retention!.exceptions.push({
      scope: customKey('1'),
      until: 'consent_withdrawn',
    });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'retention_exception',
    );
  });

  it('routes the new gap to the retention step', () => {
    expect(
      gapsInSection(['retention_exception_consent_basis'], 'retention'),
    ).toEqual(['retention_exception_consent_basis']);
  });
});

describe('addendumGaps', () => {
  it('reports nothing for an addendum that adds nothing of its own', () => {
    expect(addendumGaps(completeContent(), {})).toEqual([]);
  });

  it('reports the Art. 9 basis a camp owes for a category it adds', () => {
    expect(
      addendumGaps(completeContent(), { dataCategories: [{ key: 'health' }] }),
    ).toEqual(['special_category_basis']);
  });

  it('accepts the same category once the camp names its basis', () => {
    expect(
      addendumGaps(completeContent(), {
        dataCategories: [
          { key: 'health', specialCategoryBasis: 'explicit_consent' },
        ],
      }),
    ).toEqual([]);
  });

  it('reports the explanation a camp owes for restating a purpose', () => {
    expect(
      addendumGaps(completeContent(), {
        purposes: [
          {
            key: 'registration_administration',
            legalBasis: 'legitimate_interests',
          },
        ],
      }),
    ).toEqual(['legitimate_interest_explanation']);
  });

  it('does not blame a camp for what its organization never published', () => {
    expect(
      addendumGaps(null, { dataCategories: [{ key: 'identity' }] }),
    ).toEqual([]);
  });

  it('reports a consent-bound exception the camp hangs on the wrong purpose', () => {
    expect(
      addendumGaps(completeContent(), {
        retention: {
          months: 24,
          anchor: 'camp_end',
          exceptions: [
            {
              scope: 'registration_administration',
              until: 'consent_withdrawn',
            },
          ],
        },
      }),
    ).toEqual(['retention_exception_consent_basis']);
  });
});
