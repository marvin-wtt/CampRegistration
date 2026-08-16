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
