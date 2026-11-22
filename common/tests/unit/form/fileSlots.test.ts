import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import {
  addEventFileSlotResolver,
  consentTexts,
  fileSlotPath,
} from '../../../src/form/index.js';

describe('fileSlotPath', () => {
  it('links the slot route, root-relative', () => {
    expect(fileSlotPath('event-1', 'rules')).toBe(
      '/api/v1/events/event-1/files/slots/rules/',
    );
  });

  it('carries locale and group', () => {
    expect(
      fileSlotPath('event-1', 'rules', { locale: 'de-DE', group: 'fr' }),
    ).toBe('/api/v1/events/event-1/files/slots/rules/?locale=de-DE&group=fr');
  });
});

describe('addEventFileSlotResolver', () => {
  const consent = {
    type: 'boolean',
    name: 'consent_rules',
    title: 'I accept the [rules]({_file.rules}).',
    privacyConsent: true,
  };

  it('writes the slot link into a consent text', () => {
    const model = new SurveyModel({ elements: [consent] });
    model.locale = 'de-DE';
    model.setVariable('event.group', 'fr');
    addEventFileSlotResolver(model, 'event-1');
    model.data = { consent_rules: true };

    expect(consentTexts(model)).toEqual({
      consent_rules:
        'I accept the [rules](/api/v1/events/event-1/files/slots/rules/?locale=de-DE&group=fr).',
    });
  });
});
