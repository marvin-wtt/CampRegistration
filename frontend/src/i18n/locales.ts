/**
 * The languages the application ships content in.
 *
 * Kept separate from the message bundles so a component that renders one input
 * per language does not have to restate the list — three of them used to carry
 * their own copy, which is how a sixth locale would have been half-added.
 */
const LOCALES = ['en', 'de', 'fr', 'cs', 'pl'] as const;

export type AppLocale = (typeof LOCALES)[number];

/** Mutable on purpose: it is passed straight to `string[]` component props. */
export const APP_LOCALES: AppLocale[] = [...LOCALES];

/**
 * A camp declares the countries it runs in (`gb`, `us`, `cz`), while every
 * `Translatable` is read back by locale (`en`, `cs`). The two namespaces only
 * look alike: text stored under a country a reader is never looked up by is
 * text nobody is served.
 */
export const COUNTRY_LOCALES: Record<string, AppLocale> = {
  de: 'de',
  fr: 'fr',
  gb: 'en',
  us: 'en',
  pl: 'pl',
  cz: 'cs',
};

/**
 * The languages a camp writes its own texts in. Every locale when the camp
 * names no country — offering nothing to write in would be worse than offering
 * too much.
 */
export function localesForCountries(
  countries: string[] | undefined,
): AppLocale[] {
  const wanted = new Set(
    (countries ?? []).map((country) => COUNTRY_LOCALES[country]),
  );
  // Ordered by the app's own list rather than by the camp's countries, so the
  // tabs do not reshuffle when a country is added.
  const matched = APP_LOCALES.filter((locale) => wanted.has(locale));

  return matched.length > 0 ? matched : [...APP_LOCALES];
}
