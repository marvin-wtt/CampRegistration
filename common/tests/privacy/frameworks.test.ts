import { describe, expect, it } from 'vitest';
import {
  DSG_EKD_RECORD,
  GDPR_RECORD,
  KDG_RECORD,
  emptyPrivacyNoticeContent,
  frameworkRecord,
  frameworksFor,
  generatesLegalText,
  noticeSupervisoryAuthority,
  presetLegalBasis,
  privacyNoticeCompleteness,
  type PrivacyNoticeContent,
} from '../../src/privacy/index.js';

function complete(
  overrides: Partial<PrivacyNoticeContent> = {},
): PrivacyNoticeContent {
  return {
    ...emptyPrivacyNoticeContent(),
    purposes: [{ key: 'registration_administration', legalBasis: 'contract' }],
    dataCategories: [{ key: 'identity' }],
    recipients: [{ key: 'platform_operator' }],
    ...overrides,
  };
}

const authority = { name: 'Datenschutzaufsicht', website: null };

// docs/privacy.md, 4, "Verified citations" — read from the official texts.
describe('church framework citations', () => {
  it.each([
    ['legalBasis.consent', '§ 6 Abs. 1 lit. b KDG', '§ 6 Nr. 2 DSG-EKD'],
    ['legalBasis.contract', '§ 6 Abs. 1 lit. c KDG', '§ 6 Nr. 5 DSG-EKD'],
    [
      'legalBasis.legal_obligation',
      '§ 6 Abs. 1 lit. d KDG',
      '§ 6 Nr. 6 DSG-EKD',
    ],
    [
      'legalBasis.vital_interests',
      '§ 6 Abs. 1 lit. e KDG',
      '§ 6 Nr. 7 DSG-EKD',
    ],
    ['legalBasis.public_task', '§ 6 Abs. 1 lit. f KDG', '§ 6 Nr. 3 DSG-EKD'],
    [
      'legalBasis.legitimate_interests',
      '§ 6 Abs. 1 lit. g KDG',
      '§ 6 Nr. 4 DSG-EKD',
    ],
    [
      'specialCategoryBasis.explicit_consent',
      '§ 11 Abs. 2 lit. a KDG',
      '§ 13 Abs. 2 Nr. 1 DSG-EKD',
    ],
    [
      'specialCategoryBasis.vital_interests',
      '§ 11 Abs. 2 lit. c KDG',
      '§ 13 Abs. 2 Nr. 3 DSG-EKD',
    ],
    [
      'specialCategoryBasis.nonprofit_body',
      '§ 11 Abs. 2 lit. d KDG',
      '§ 13 Abs. 2 Nr. 4 DSG-EKD',
    ],
    [
      'specialCategoryBasis.legal_claims',
      '§ 11 Abs. 2 lit. f KDG',
      '§ 13 Abs. 2 Nr. 6 DSG-EKD',
    ],
    [
      'specialCategoryBasis.public_interest',
      '§ 11 Abs. 2 lit. g KDG',
      '§ 13 Abs. 2 Nr. 7 DSG-EKD',
    ],
    [
      'specialCategoryBasis.health_care',
      '§ 11 Abs. 2 lit. h KDG',
      '§ 13 Abs. 2 Nr. 8 DSG-EKD',
    ],
    ['right.access', '§ 17 KDG', '§ 19 DSG-EKD'],
    ['right.rectification', '§ 18 KDG', '§ 20 DSG-EKD'],
    ['right.erasure', '§ 19 KDG', '§ 21 DSG-EKD'],
    ['right.restriction', '§ 20 KDG', '§ 22 DSG-EKD'],
    ['right.portability', '§ 22 KDG', '§ 24 DSG-EKD'],
    ['right.object', '§ 23 KDG', '§ 25 DSG-EKD'],
    ['specialCategories', '§ 11 KDG', '§ 13 DSG-EKD'],
    ['withdrawal', '§ 8 Abs. 4 KDG', '§ 11 Abs. 3 DSG-EKD'],
    ['freelyGiven', '§ 8 Abs. 5 KDG', '§ 11 Abs. 4 DSG-EKD'],
    [
      'automatedInformation',
      '§ 15 Abs. 2 lit. f KDG',
      '§ 17 Abs. 2 Nr. 5 DSG-EKD',
    ],
    ['transferDerogation', '§ 41 KDG', '§ 10 Abs. 2 DSG-EKD'],
  ] as const)('%s', (key, kdg, dsgEkd) => {
    expect(KDG_RECORD.citations[key]).toBe(kdg);
    expect(DSG_EKD_RECORD.citations[key]).toBe(dsgEkd);
  });

  it('cites a version each, so published notices keep their citations', () => {
    expect(KDG_RECORD.version).toBe('kdg-2025-11-24');
    expect(DSG_EKD_RECORD.version).toBe('dsg-ekd-2025-01-15');
    expect(frameworkRecord('kdg', 'kdg-2025-11-24')).toBe(KDG_RECORD);
    // A version of another law never resolves to it.
    expect(frameworkRecord('kdg', 'gdpr-2016-679')).toBe(KDG_RECORD);
  });
});

describe('framework choice', () => {
  it('offers the church laws in Germany only', () => {
    expect(frameworksFor('de')).toEqual(['gdpr', 'kdg', 'dsg_ekd']);
    expect(frameworksFor('fr')).toEqual(['gdpr']);
  });

  it('gives a guided notice under each law its legal text', () => {
    expect(generatesLegalText({ mode: 'builder', framework: 'kdg' })).toBe(
      true,
    );
    expect(generatesLegalText({ mode: 'builder', framework: 'dsg_ekd' })).toBe(
      true,
    );
  });
});

describe('restricted bases', () => {
  it('leaves a basis the law attaches conditions to for the author', () => {
    expect(presetLegalBasis('legitimate_interests', 'kdg')).toBeNull();
    expect(presetLegalBasis('legitimate_interests', 'gdpr')).toBe(
      'legitimate_interests',
    );
    expect(presetLegalBasis('legitimate_interests', 'dsg_ekd')).toBe(
      'legitimate_interests',
    );
    expect(presetLegalBasis('contract', 'kdg')).toBe('contract');
  });

  it('refuses publishing a purpose without a basis', () => {
    const content = complete({
      purposes: [{ key: 'photo_documentation', legalBasis: null }],
    });

    expect(privacyNoticeCompleteness(content).gaps).toContain('purpose_basis');
  });
});

describe('supervisory authority', () => {
  it('needs the author to name it under a church law', () => {
    const content = complete({ framework: 'kdg' });

    expect(privacyNoticeCompleteness(content).gaps).toContain(
      'supervisory_authority',
    );
    expect(
      privacyNoticeCompleteness({ ...content, supervisoryAuthority: authority })
        .gaps,
    ).not.toContain('supervisory_authority');
  });

  it('asks for none on a free-text notice', () => {
    const content = complete({
      framework: 'kdg',
      mode: 'free_text',
      freeText: { en: '<p>Notice</p>' },
    });

    expect(privacyNoticeCompleteness(content).gaps).not.toContain(
      'supervisory_authority',
    );
  });

  it('derives it under the GDPR and asks for nothing', () => {
    expect(privacyNoticeCompleteness(complete()).gaps).not.toContain(
      'supervisory_authority',
    );
    expect(noticeSupervisoryAuthority(complete(), 'at')?.name).toBe(
      'Österreichische Datenschutzbehörde',
    );
  });

  it('names the one entered under a church law, never one from the country', () => {
    const content = complete({
      framework: 'dsg_ekd',
      supervisoryAuthority: { name: 'Der Beauftragte', website: null },
    });

    expect(noticeSupervisoryAuthority(content, 'de')).toEqual({
      name: 'Der Beauftragte',
      website: '',
    });
    expect(
      noticeSupervisoryAuthority(
        { ...content, supervisoryAuthority: null },
        'de',
      ),
    ).toBeNull();
  });

  it('names none for a free-text notice, which names it itself', () => {
    expect(
      noticeSupervisoryAuthority(
        complete({ mode: 'free_text', framework: null }),
        'at',
      ),
    ).toBeNull();
  });

  it('keeps the GDPR record deriving it', () => {
    expect(GDPR_RECORD.authority).toBe('derived');
    expect(KDG_RECORD.authority).toBe('entered');
    expect(DSG_EKD_RECORD.authority).toBe('entered');
  });
});
