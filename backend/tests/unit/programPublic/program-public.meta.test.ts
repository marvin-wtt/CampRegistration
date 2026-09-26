import { beforeAll, describe, expect, it } from 'vitest';
import type { Event } from '@camp-registration/common/entities';
import { initI18n } from '#core/i18n/i18n.client';
import { buildProgramPublicPageMeta } from '#app/programPublic/program-public.meta';

const event = (data: Partial<Event> = {}): Event =>
  ({
    id: '01JB000000000000000000000X',
    name: 'Sommerlager',
    ...data,
  }) as Event;

describe('buildProgramPublicPageMeta', () => {
  beforeAll(async () => {
    await initI18n();
  });

  // The five the backend registers in `src/i18n/index.ts`. Spelled out rather
  // than derived, so adding a locale without translating this description
  // fails here.
  const locales = ['en', 'de', 'fr', 'cs', 'pl'] as const;

  it.each(locales)('renders a translated description in %s', (locale) => {
    const meta = buildProgramPublicPageMeta(event(), locale);

    expect(meta.description).toContain('Sommerlager');
    // A key that fails to resolve renders as its raw i18next source
    // (`$t(...)` or the bare key) — catch that rather than trust it silently.
    expect(meta.description).not.toMatch(/\$t\(|^description$/);
  });

  it('resolves the translatable name for the requested locale', () => {
    const meta = buildProgramPublicPageMeta(
      event({ name: { de: 'Sommerlager', fr: 'Camp d’été' } }),
      'fr-FR',
    );

    expect(meta.title).toBe('Camp d’été');
    expect(meta.description).toContain('Camp d’été');
  });

  it('points at the public program path', () => {
    expect(buildProgramPublicPageMeta(event(), 'en-US').url).toMatch(
      /\/events\/01JB000000000000000000000X\/program$/,
    );
  });

  it('carries the logo as the preview image when the event has one', () => {
    expect(buildProgramPublicPageMeta(event(), 'en-US').image).toBeUndefined();
    expect(
      buildProgramPublicPageMeta(
        event({ logo: 'https://example.org/api/v1/files/1' }),
        'en-US',
      ).image,
    ).toBe('https://example.org/api/v1/files/1');
  });

  it('normalizes region-variant locales for the meta tag', () => {
    expect(buildProgramPublicPageMeta(event(), 'de-DE').locale).toBe('de_DE');
  });

  it('keeps a bare language locale as-is', () => {
    expect(buildProgramPublicPageMeta(event(), 'de').locale).toBe('de');
  });
});
