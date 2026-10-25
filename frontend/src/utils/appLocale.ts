const LANGUAGE_LOCALES: Record<string, string> = {
  de: 'de-DE',
  fr: 'fr-FR',
  pl: 'pl-PL',
  cs: 'cs-CZ',
};

/**
 * The UI locale for a browser's language. English is British unless the
 * browser asks for American, since the audience is mostly European; anything
 * unsupported gets English too.
 */
export function appLocaleFor(browserLocale: string | undefined): string {
  const locale = browserLocale?.toLowerCase() ?? '';
  const language = locale.split('-')[0] ?? '';

  if (locale === 'en-us') {
    return 'en-US';
  }

  return LANGUAGE_LOCALES[language] ?? 'en-GB';
}
