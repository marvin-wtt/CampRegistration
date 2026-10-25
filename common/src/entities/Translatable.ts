/**
 * Text (or a value) per language, keyed by locale (`en`, `cs`) — or a single
 * value for every language.
 */
export type Translatable<T = string> = T | Record<string, T>;

/**
 * A value per group, keyed by the group's country code as in `event.countries`
 * (`gb`, `cz`) — or a single value for every group. Not a translation: `gb`
 * and `us` share a language and may still differ. Resolve it with `forGroup`,
 * never by locale.
 */
export type PerGroup<T> = T | Record<string, T>;
