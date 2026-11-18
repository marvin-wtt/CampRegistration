import { translate as translateValue } from '../../utils/translatable.js';

// Expected input: [value: object | string, locale?: string, fallback?: string]
const translate = (params: unknown[]): unknown => {
  const [value, locale = null, fallback = null] = params;

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value !== 'object' || !value) {
    return null;
  }

  if (locale !== null && typeof locale !== 'string') {
    return null;
  }

  const entries = value as Record<string, unknown>;

  // Only empty entries: keep the empty text rather than turning it into null.
  return (
    translateValue(
      entries,
      locale ?? 'en-US',
      typeof fallback === 'string' ? fallback : 'en-US',
    ) ??
    Object.values(entries)[0] ??
    null
  );
};

export default translate;
