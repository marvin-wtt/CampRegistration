import { describe, expect, it } from 'vitest';
import {
  extractPrivacyTags,
  uncoveredConsentCategories,
} from '@camp-registration/common/form';
import { EVENT_PRESET_NAMES } from '@camp-registration/common/entities';
import {
  PRIVACY_PURPOSE_KEYS,
  SPECIAL_CATEGORY_DATA_KEYS,
} from '@camp-registration/common/privacy';
import { EVENT_PRESETS } from '#app/event/presets/index';
import { SurveyModel } from 'survey-core';

// Explicit consent is the default Art. 9 basis, so a preset must work with it
// for every special category it collects.
const consentBased = new Set<string>(SPECIAL_CATEGORY_DATA_KEYS);

describe('event preset privacy tags', () => {
  it.each(EVENT_PRESET_NAMES)(
    '%s form covers its special categories with a consent',
    (name) => {
      const tags = extractPrivacyTags(EVENT_PRESETS[name].form);

      expect(uncoveredConsentCategories(tags, consentBased)).toEqual([]);
    },
  );

  it.each(['camp', 'seminar'] as const)(
    '%s form tags its health questions',
    (name) => {
      const tags = extractPrivacyTags(EVENT_PRESETS[name].form);

      expect(tags.tagged.length).toBeGreaterThan(0);
    },
  );

  it.each(EVENT_PRESET_NAMES)('%s form tags its photo consent', (name) => {
    const tags = extractPrivacyTags(EVENT_PRESETS[name].form);

    expect(tags.consents.map((entry) => entry.name)).toContain(
      'consent_privacy',
    );
  });

  it.each(['camp', 'seminar'] as const)(
    '%s form asks its health consent only once health data was entered',
    (name) => {
      const survey = new SurveyModel(EVENT_PRESETS[name].form);
      const consent = survey
        .getAllQuestions()
        .find(
          (question) =>
            (
              question.getPropertyValue('privacyConsentFor') as
                string[] | undefined
            )?.length,
        );
      const tagged = survey
        .getAllQuestions()
        .filter((question) => question.getPropertyValue('privacyCategory'));

      expect(consent).toBeDefined();
      expect(tagged.length).toBeGreaterThan(0);
      // Never preselected, and optional data stays optional.
      expect(consent?.defaultValue).toBeUndefined();
      for (const question of tagged) {
        expect(question.isRequired).toBe(false);
        expect(question.isVisible).toBe(true);
      }
      expect(consent?.isVisible).toBe(false);

      // "No known allergies" is health information too.
      survey.setValue(tagged[0]!.getValueName(), 'No known allergies');
      expect(consent?.isVisible).toBe(true);
      expect(consent?.hasErrors(false)).toBe(true);

      survey.setValue(consent!.getValueName(), true);
      expect(consent?.hasErrors(false)).toBe(false);
    },
  );

  it.each(EVENT_PRESET_NAMES)(
    '%s form names a catalogue purpose on every consent',
    (name) => {
      const purposes = new Set<string>(PRIVACY_PURPOSE_KEYS);

      for (const consent of extractPrivacyTags(EVENT_PRESETS[name].form)
        .consents) {
        expect(consent.purposes.length, consent.name).toBeGreaterThan(0);
        expect(consent.purposes.every((key) => purposes.has(key))).toBe(true);
      }
    },
  );

  it('camp form asks for the newsletter through its consent purpose', () => {
    const consents = extractPrivacyTags(EVENT_PRESETS.camp.form).consents;

    expect(
      consents.find((consent) => consent.purposes.includes('newsletter'))?.name,
    ).toBe('newsletter');
  });
});
