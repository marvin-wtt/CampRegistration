import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import messages from '@/i18n/messages';

// The global setup mocks vue-i18n; this test is about its real fallback.
vi.unmock('vue-i18n');

describe('messages', () => {
  it('falls back to American English where British English has no text', () => {
    const { t } = createI18n({
      legacy: false,
      locale: 'en-GB',
      fallbackLocale: 'en-US',
      messages,
      fallbackWarn: false,
    }).global;

    expect(t('app_name')).toBe('Inscriva');
  });
});
