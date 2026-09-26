export const translateObject = <T>(
  value: Record<string, T> | T,
  locale: string | undefined,
): T => {
  const v = objectValueOrAll(value, locale);

  return Array.isArray(v) ? v[0] : v;
};

export const objectValueOrAll = <T>(
  value: Record<string, T> | T,
  locale: string | undefined,
): T | T[] => {
  if (typeof value !== 'object' || !value) {
    return value;
  }

  if (!locale) {
    return Object.values(value) as T[];
  }

  const [language, country] = locale.split('-');
  if (language in value) {
    return value[language as keyof typeof value] as T;
  }

  // Use country for fields mapped to country codes
  if (country) {
    const c = country.toLowerCase();
    if (c in value) {
      return value[c as keyof typeof value] as T;
    }
  }

  return Object.values(value) as T[];
};
