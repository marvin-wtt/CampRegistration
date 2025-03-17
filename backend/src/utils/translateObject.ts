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
    return Object.values(value);
  }

  const key = locale.split('-')[0];
  if (key in value) {
    return value[key as keyof typeof value] as T;
  }

  return Object.values(value);
};
