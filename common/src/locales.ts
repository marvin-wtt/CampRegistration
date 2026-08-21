/**
 * The languages the application ships content in - forms, table templates,
 * message templates and the frontend's own UI all carry a translation per
 * entry here. Kept in one place so frontend and backend can't drift apart on
 * what "supported" means.
 */
export const APP_LOCALES = ['en', 'de', 'fr', 'cs', 'pl'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
