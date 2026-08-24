import { beforeAll, describe, expect, it } from 'vitest';
import i18n, { initI18n } from '#core/i18n';
import { RETENTION_ANCHORS } from '@camp-registration/common/privacy';

/**
 * The retention reminder is the one mail whose body is assembled by i18next
 * nesting: the payload carries the anchor as a catalogue key, and the sentence
 * pulls its phrase in with `$t(event:email.retentionDue.anchor.{{anchor}})`.
 *
 * A nesting key that does not resolve renders as the raw `$t(...)` source, and
 * nothing else in the pipeline notices — the mail sends, and the recipient
 * reads a template. So it is checked here rather than trusted.
 */
describe('retention reminder translations', () => {
  beforeAll(async () => {
    await initI18n();
  });

  // The five the backend registers in `src/i18n/index.ts`. Spelled out rather
  // than derived, so adding a locale without translating this mail fails here.
  const locales = ['en', 'de', 'fr', 'cs', 'pl'] as const;

  it.each(locales)('renders every key in %s', (locale) => {
    const t = i18n.getFixedT(locale, 'event', 'email.retentionDue');

    const keys = [
      'text.title',
      'text.action',
      'text.exceptions',
      'text.consentBound',
      'text.noAutomaticDeletion',
      'text.button',
      'text.greeting',
      'text.teamName',
      'footer.cause',
    ];

    for (const key of keys) {
      const value = t(key);

      expect(value, `${locale} is missing ${key}`).not.toBe(key);
      expect(
        value,
        `${locale} left a nesting unresolved in ${key}`,
      ).not.toContain('$t(');
    }
  });

  it.each(locales)('resolves the anchor nesting in %s', (locale) => {
    const t = i18n.getFixedT(locale, 'event', 'email.retentionDue');

    for (const anchor of RETENTION_ANCHORS) {
      const sentence = t('text.information', {
        event: { name: 'Summer Event' },
        months: 24,
        dueAt: '1 August 2027',
        anchor,
      });

      expect(sentence).not.toContain('$t(');
      expect(sentence).toContain('24');
      expect(sentence).toContain('Summer Event');
      expect(sentence).toContain('1 August 2027');
      // The phrase itself, not the key it was pulled in by.
      expect(sentence).not.toContain(anchor);
      expect(sentence).toContain(
        i18n.getFixedT(locale, 'event')(`email.retentionDue.anchor.${anchor}`),
      );
    }
  });

  it.each(locales)('names the subject and preview in %s', (locale) => {
    const t = i18n.getFixedT(locale, 'event', 'email.retentionDue');
    const event = { name: 'Summer Event' };

    expect(t('subject', { event })).toContain('Summer Event');
    expect(t('preview', { event })).toContain('Summer Event');
  });
});
