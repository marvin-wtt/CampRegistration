import { beforeAll, describe, expect, it } from 'vitest';
import i18n, { initI18n } from '#core/i18n/i18n.client';
import { EVENT_RETENTION_DEADLINE_KINDS } from '@camp-registration/common/privacy';

/**
 * The retention mail names the kind of data by i18next nesting: the payload
 * carries the kind as a key, and the sentence pulls its phrase in with
 * `$t(retention:kind.{{kindKey}})`. A nesting that does not resolve renders as
 * the raw `$t(...)` source and nothing else notices, so it is checked here.
 */
describe('retention reminder translations', () => {
  beforeAll(async () => {
    await initI18n();
  });

  // Spelled out rather than derived, so adding a locale without translating
  // this mail fails here.
  const locales = ['en', 'de', 'fr', 'cs', 'pl'] as const;

  const variants = ['manager.upcoming', 'manager.due'] as const;

  const vars = (kindKey: string) => ({
    event: { name: 'Summer Camp' },
    kindKey,
    days: 7,
    date: '01.08.2027',
  });

  it.each(locales)('renders every variant in %s', (locale) => {
    for (const variant of variants) {
      const t = i18n.getFixedT(locale, 'retention', `email.${variant}`);

      for (const kind of EVENT_RETENTION_DEADLINE_KINDS) {
        for (const key of [
          'subject',
          'preview',
          'text.title',
          'text.information',
          'text.button',
          'text.greeting',
          'footer.cause',
        ]) {
          const value = t(key, vars(kind));

          expect(value, `${locale} ${variant} is missing ${key}`).not.toBe(key);
          expect(value, `${locale} ${variant} ${key}`).not.toContain('$t(');
        }
      }
    }
  });

  it.each(locales)('names the kind of data in %s', (locale) => {
    for (const kind of EVENT_RETENTION_DEADLINE_KINDS) {
      const sentence = i18n.getFixedT(
        locale,
        'retention',
        'email.manager.upcoming',
      )('text.information', vars(kind));

      expect(sentence).toContain('Summer Camp');
      expect(sentence).toContain('01.08.2027');
      expect(sentence).toContain(
        i18n.getFixedT(locale, 'retention')(`kind.${kind}`),
      );
    }
  });
});
