import type { Request } from 'express';

const DEFAULT_LOCALE = 'en-US';

/**
 * The request's preferred locale, as a canonical BCP-47 tag.
 *
 * `Accept-Language` is unvalidated input — it may be absent, empty, or hold
 * tag-shaped junk that `req.acceptsLanguages()` passes straight through — while
 * callers either persist the result (`users.locale`, `registrations.locale`) or
 * hand it to `Intl`, which throws a `RangeError` on a malformed tag. Anything
 * unusable becomes the default rather than reaching them.
 *
 * Canonicalising also fixes casing, so a client asking for `de-de` matches the
 * `de-DE` translations instead of falling back.
 */
export const requestLocale = (req: Request): string => {
  // `.at()` rather than `[0]`: the express types promise a `string[]`, but an
  // empty `Accept-Language` header parses to no language at all.
  const locale = req.acceptsLanguages().at(0);

  // A missing header is a wildcard; an empty one yields nothing.
  if (locale === undefined || locale.trim() === '*') {
    return DEFAULT_LOCALE;
  }

  try {
    return Intl.getCanonicalLocales(locale)[0] ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};
