/**
 * Rewriting a pre-built HTML shell's `<head>` for one page.
 *
 * Knows nothing about what a page *is* — a caller hands over finished strings,
 * so no domain object can leak a field into a tag it was never given.
 */
export interface PageMeta {
  title: string;
  siteName: string;
  description?: string;
  url?: string;
  locale?: string;
  image?: string;
}

// What crawlers actually display: a longer title or description is not shown,
// it is cut mid-word by the client.
const TITLE_MAX_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 200;

// Text arrives as user content — multi-line, padded, arbitrarily long — so it
// is fitted to a card here rather than by each caller.

const singleLine = (value: string): string =>
  value.replace(/\s+/gu, ' ').trim();

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// The shell ships a `<title>` and a `<meta name="description">`; anything this
// module writes must replace those rather than sit beside them. Open Graph tags
// are stripped too, so a shell that grows defaults later cannot end up with two.
const TITLE_PATTERN = /<title>[\s\S]*?<\/title>/iu;
const HEAD_END_PATTERN = /<\/head>/iu;
// A built shell is minified, so attribute values may be unquoted.
const REPLACED_META_PATTERN =
  /<meta[^>]*?(?:property|name)\s*=\s*["']?(?:og:|twitter:|description)[^>]*>/giu;
const REPLACED_CANONICAL_PATTERN =
  /<link[^>]*?rel\s*=\s*["']?canonical["']?[^>]*>/giu;

function renderTags(meta: PageMeta): string {
  const entries: [
    attribute: 'property' | 'name',
    key: string,
    value: string,
  ][] = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', meta.siteName],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description ?? ''],
    ['property', 'og:url', meta.url ?? ''],
    ['property', 'og:locale', meta.locale ?? ''],
    ['property', 'og:image', meta.image ?? ''],
    ['name', 'description', meta.description ?? ''],
    // The one Twitter tag with no Open Graph equivalent — it selects the card
    // size. `twitter:title`/`twitter:description` are deliberately absent:
    // every consumer falls back to `og:*`, so they are pure duplication.
    ['name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary'],
  ];

  const tags = entries
    .filter(([, , value]) => value.length > 0)
    .map(
      ([attribute, key, value]) =>
        `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`,
    );

  if (meta.url !== undefined) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.url)}">`);
  }

  return tags.join('');
}

/**
 * Returns `null` when the shell does not look like the document we expect, so
 * an unrecognised build degrades to the page as served instead of a broken one.
 */
export function injectPageMeta(
  template: string,
  meta: PageMeta,
): string | null {
  if (!TITLE_PATTERN.test(template) || !HEAD_END_PATTERN.test(template)) {
    return null;
  }

  const siteName = truncate(singleLine(meta.siteName), TITLE_MAX_LENGTH);
  const fitted: PageMeta = {
    ...meta,
    // A page without a title of its own is still the site's page.
    title: truncate(singleLine(meta.title), TITLE_MAX_LENGTH) || siteName,
    siteName,
    description:
      meta.description === undefined
        ? undefined
        : truncate(singleLine(meta.description), DESCRIPTION_MAX_LENGTH),
  };

  return template
    .replace(REPLACED_META_PATTERN, '')
    .replace(REPLACED_CANONICAL_PATTERN, '')
    .replace(TITLE_PATTERN, `<title>${escapeHtml(fitted.title)}</title>`)
    .replace(HEAD_END_PATTERN, `${renderTags(fitted)}</head>`);
}
