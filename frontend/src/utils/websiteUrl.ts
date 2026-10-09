// Mirrors the backend's `z.url({ protocol: /^https?$/, hostname: z.regexes.domain })`.
const DOMAIN =
  /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const MAX_LENGTH = 255;

/**
 * People type `example.com` rather than `https://example.com`. Add the scheme
 * so the common case is accepted instead of rejected.
 */
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '' || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function isValidWebsiteUrl(value: string): boolean {
  if (value.length > MAX_LENGTH) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    DOMAIN.test(url.hostname)
  );
}
