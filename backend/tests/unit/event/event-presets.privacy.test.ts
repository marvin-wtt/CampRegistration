import { describe, expect, it } from 'vitest';
import {
  extractPrivacyTags,
  uncoveredConsentCategories,
} from '@camp-registration/common/form';
import { EVENT_PRESET_NAMES } from '@camp-registration/common/entities';
import { SPECIAL_CATEGORY_DATA_KEYS } from '@camp-registration/common/privacy';
import { EVENT_PRESETS } from '#app/event/presets/index';

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
});
