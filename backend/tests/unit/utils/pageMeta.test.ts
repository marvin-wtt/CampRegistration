import { describe, expect, it } from 'vitest';
import { injectPageMeta, type PageMeta } from '#utils/pageMeta';

/** The shell as Quasar emits it: minified, comments stripped, quotes dropped. */
const SHELL =
  '<!doctype html><html><head><title>Camp Registrations</title>' +
  '<meta charset=utf-8><meta name=description content="Manage camp registrations">' +
  '<meta property=og:title content="Camp Registrations">' +
  '<meta name=twitter:card content=summary>' +
  '<link rel=canonical href="https://example.org">' +
  '</head><body><div id=q-app></div></body></html>';

const meta = (data: Partial<PageMeta> = {}): PageMeta => ({
  title: 'Sommerlager',
  siteName: 'Camp Registrations',
  description: 'Berlin',
  url: 'https://example.org/events/1',
  locale: 'de_DE',
  ...data,
});

describe('injectPageMeta', () => {
  it('replaces the title', () => {
    expect(injectPageMeta(SHELL, meta())).toContain(
      '<title>Sommerlager</title>',
    );
  });

  it('replaces the shell defaults rather than duplicating them', () => {
    const html = injectPageMeta(SHELL, meta()) ?? '';

    expect(html.match(/og:title/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html.match(/rel="?canonical/g)).toHaveLength(1);
    // The stale tags carry the shell's unquoted attributes; ours are quoted.
    expect(html).not.toContain('property=og:title');
    expect(html).not.toContain('name=twitter:card');
  });

  it('leaves the body untouched', () => {
    expect(injectPageMeta(SHELL, meta())).toContain('<div id=q-app></div>');
  });

  it('escapes every value it writes', () => {
    const html =
      injectPageMeta(SHELL, meta({ title: '<script>alert("x")</script>' })) ??
      '';

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('omits tags it has no value for', () => {
    const html = injectPageMeta(SHELL, meta({ description: undefined })) ?? '';

    expect(html).not.toContain('og:description');
    expect(html).not.toContain('name="description"');
  });

  it('announces a large card only when there is an image', () => {
    expect(injectPageMeta(SHELL, meta())).toContain(
      '<meta name="twitter:card" content="summary">',
    );
    expect(
      injectPageMeta(SHELL, meta({ image: 'https://example.org/a.png' })),
    ).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('falls back to the site name when the page has no title', () => {
    expect(injectPageMeta(SHELL, meta({ title: '' }))).toContain(
      '<title>Camp Registrations</title>',
    );
  });

  it('collapses whitespace in user content', () => {
    const html =
      injectPageMeta(SHELL, meta({ title: '  Sommer\n\tlager  ' })) ?? '';

    expect(html).toContain('<title>Sommer lager</title>');
    expect(html).toContain('content="Sommer lager"');
  });

  it('truncates a title and a description to what a card shows', () => {
    const html =
      injectPageMeta(
        SHELL,
        meta({ title: 'a'.repeat(200), description: 'b'.repeat(400) }),
      ) ?? '';

    expect(/<title>(.*?)<\/title>/.exec(html)?.[1]).toHaveLength(70);
    expect(
      /property="og:description" content="([^"]*)"/.exec(html)?.[1],
    ).toHaveLength(200);
    expect(html).toContain('…');
  });

  it('returns null for a shell it does not recognise', () => {
    expect(
      injectPageMeta('<html><body>no head</body></html>', meta()),
    ).toBeNull();
  });
});
