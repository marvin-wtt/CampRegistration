/**
 * Text (or a value) per language, keyed by locale (`en`, `cs`) — or a single
 * value for every language.
 */
export type Translatable<T = string> = T | Record<string, T>;

/**
 * A value per country an event runs in, keyed by country code (`gb`, `cz`) —
 * or a single value for every country. Not a translation: `gb` and `us` share
 * a language and may still differ. Resolve it with `forCountry`, never by
 * locale.
 */
export type PerCountry<T> = T | Record<string, T>;
