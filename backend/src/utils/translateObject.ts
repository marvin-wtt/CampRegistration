export const translateObject = (
  value: Record<string, string> | string,
  locale: string | undefined,
): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (!locale) {
    return Object.values(value)[0];
  }

  const key = locale.split('-')[0];
  if (key in value) {
    return value[key];
  }

  return Object.values(value)[0];
};
