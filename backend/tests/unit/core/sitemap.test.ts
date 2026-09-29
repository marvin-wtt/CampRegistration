import { describe, expect, it } from 'vitest';
import { renderSitemap } from '#core/seo/sitemap';

describe('renderSitemap', () => {
  it('lists every entry', () => {
    const xml = renderSitemap([
      { url: 'https://example.org/' },
      { url: 'https://example.org/events' },
    ]);

    expect(xml).toContain('<loc>https://example.org/</loc>');
    expect(xml).toContain('<loc>https://example.org/events</loc>');
  });

  it('writes a last-modified date only when known', () => {
    const xml = renderSitemap([
      {
        url: 'https://example.org/events/1',
        lastModified: new Date('2026-09-20T10:00:00Z'),
      },
      { url: 'https://example.org/events/2', lastModified: null },
    ]);

    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain('<lastmod>2026-09-20T10:00:00.000Z</lastmod>');
  });

  it('escapes URLs', () => {
    expect(renderSitemap([{ url: 'https://example.org/?a=1&b=2' }])).toContain(
      '<loc>https://example.org/?a=1&amp;b=2</loc>',
    );
  });
});
