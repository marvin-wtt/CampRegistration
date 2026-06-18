// Central configuration for the i18n tooling (validator + locale scaffolder).
//
// This is the ONE place to edit when adding a new locale: append its short code
// to `LOCALES` and its regional directory to `REGION_DIRS`, then run
// `npm run i18n:add-locale -- <code>` to scaffold the strings.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// frontend/ root (scripts/i18n -> scripts -> frontend)
export const FRONTEND_ROOT = resolve(here, '..', '..');
export const SRC_DIR = resolve(FRONTEND_ROOT, 'src');
export const I18N_DIR = resolve(SRC_DIR, 'i18n');

// Short locale codes as used in SFC `<i18n locale="..">` blocks.
// Order is significant: the source locale must come first.
export const LOCALES = ['en', 'de', 'fr', 'pl', 'cs'];

// The canonical locale. Other locales are validated/scaffolded against it.
export const SOURCE_LOCALE = 'en';

// Map short codes -> regional directories under src/i18n/ for the global store
// translations (e.g. src/i18n/de-DE/index.ts).
export const REGION_DIRS = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  pl: 'pl-PL',
  cs: 'cs-CZ',
};

// Human-readable language names, used in the translation prompt.
export const LOCALE_NAMES = {
  en: 'English',
  de: 'German',
  fr: 'French',
  pl: 'Polish',
  cs: 'Czech',
};

// `<i18n locale="..">` values that are NOT real translation locales and must be
// left untouched by the validator and the scaffolder (e.g. enum-style blocks).
export const NON_LOCALE_BLOCKS = new Set(['locale', 'country']);

// Dotted key paths exempt from completeness checks AND machine translation, but
// ONLY within the global src/i18n/<region> trees — never in SFC <i18n> blocks.
// Brand names and identifiers defined once in the source locale belong here
// (e.g. `app_name`, which only exists in src/i18n/en-US and falls back).
// Supports a trailing `.*` wildcard.
export const GLOBAL_EXCLUDED_KEYS = ['app_name'];
