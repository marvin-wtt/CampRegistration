export const translateObject = <T>(
  value: Record<string, T> | T,
  locale: string | undefined,
): T => {
  if (typeof value !== 'object' || !value) {
    return value;
  }

  if (!locale) {
    return Object.values(value)[0];
  }

  const key = locale.split('-')[0];
  if (key in value) {
    return value[key as keyof typeof value] as T;
  }

  return Object.values(value)[0];
};
