import { escapeHtml } from '#core/seo/pageMeta';

export interface SitemapEntry {
  url: string;
  lastModified?: Date | null | undefined;
}

/** Renders a sitemap.xml document (sitemaps.org protocol). */
export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map(({ url, lastModified }) => {
    const lastmod = lastModified
      ? `<lastmod>${lastModified.toISOString()}</lastmod>`
      : '';

    return `<url><loc>${escapeHtml(url)}</loc>${lastmod}</url>`;
  });

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.join('') +
    '</urlset>'
  );
}
