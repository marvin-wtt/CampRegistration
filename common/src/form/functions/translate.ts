const translate = (params: unknown[]): unknown => {
  // Expected input: [value: object | string, locale: string, fallback?: string]
  const defaultFallback = 'en-US';

  if (params.length === 0) {
    return null;
  }

  const value = params[0] as Record<string, unknown> | string | null;
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value !== 'object' || !value || params.length < 2) {
    return null;
  }

  const locale = params[1];
  if (typeof locale !== 'string') {
    return null;
  }

  if (locale in value) {
    return value[locale];
  }

  const fallback =
    params.length >= 3 && typeof params[2] === 'string'
      ? params[2]
      : defaultFallback;

  if (fallback in value) {
    return value[fallback];
  }

  const shortFallback = fallback.split('-')[0];
  if (shortFallback in value) {
    return value[shortFallback];
  }

  return Object.values(value)[0];
};

export default translate;
