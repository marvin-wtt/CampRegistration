const joinStrings = (params: unknown[]): string | null => {
  if (params.length === 0) {
    return null;
  }

  const strings = params[0];
  if (
    !Array.isArray(strings) ||
    !strings.every((value) => typeof value === 'string')
  ) {
    return null;
  }

  const conjunctions: Record<string, string> = {
    en: 'and',
    de: 'und',
    fr: 'et',
  };

  // Validate and set the locale
  // Get the translation of "and" based on the locale
  const locale = params.length >= 2 ? params[1] : 'en';
  const selectedLocale =
    typeof locale === 'string' && locale in conjunctions ? locale : 'en';

  const andTranslation = conjunctions[selectedLocale];

  if (strings.length === 1) {
    return strings[0];
  }

  // Join the strings with commas and the translated "and"
  const allButLast = strings.slice(0, -1).join(', ');
  const last = strings[strings.length - 1];
  return `${allButLast} ${andTranslation} ${last}`;
};

export default joinStrings;
