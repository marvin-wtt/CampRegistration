import { describe, expect, it } from 'vitest';
import { appLocaleFor } from '@/utils/appLocale';

describe('appLocaleFor', () => {
  it('keeps American English for US browsers', () => {
    expect(appLocaleFor('en-US')).toBe('en-US');
  });

  it.each(['en', 'en-GB', 'en-IE', 'en-AU'])(
    'uses British English for %s',
    (browserLocale) => {
      expect(appLocaleFor(browserLocale)).toBe('en-GB');
    },
  );

  it.each([
    ['de', 'de-DE'],
    ['de-AT', 'de-DE'],
    ['fr-BE', 'fr-FR'],
    ['pl', 'pl-PL'],
    ['cs-CZ', 'cs-CZ'],
  ])('maps %s to %s', (browserLocale, appLocale) => {
    expect(appLocaleFor(browserLocale)).toBe(appLocale);
  });

  it.each(['it-IT', '', undefined])(
    'falls back to British English for %s',
    (browserLocale) => {
      expect(appLocaleFor(browserLocale)).toBe('en-GB');
    },
  );
});
