import { beforeAll, describe, expect, it } from 'vitest';
import i18n, { initI18n } from '#core/i18n/i18n.client';

describe('i18n', () => {
  beforeAll(async () => {
    await initI18n();
  });

  // British English has no texts of its own; it must not fall through to a
  // raw key.
  it('renders British English with the English texts', () => {
    const t = i18n.getFixedT('en-GB', 'feedback');

    expect(t('email.subject')).toBe('New Feedback');
  });
});
