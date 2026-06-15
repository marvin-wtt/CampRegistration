interface LocalizedFile {
  field: string | null;
  locale: string | null;
}

/**
 * Selects the best-matching file per field for a given locale.
 * Priority: exact locale match > language prefix match > default (null locale).
 * Files that don't match at all are excluded.
 */
export function selectFilesByLocale<T extends LocalizedFile>(
  files: T[],
  locale: string,
): Record<string, T> {
  const result: Record<string, T> = {};

  for (const file of files) {
    if (!file.field) {
      continue;
    }

    const score = localeScore(file.locale, locale);
    if (score < 0) {
      continue;
    }

    const current = result[file.field] as T | undefined;
    if (!current || score > localeScore(current.locale, locale)) {
      result[file.field] = file;
    }
  }

  return result;
}

function localeScore(fileLocale: string | null, targetLocale: string): number {
  if (fileLocale === null) {
    return 0;
  }
  if (fileLocale === targetLocale) {
    return 2;
  }
  if (fileLocale.split('-')[0] === targetLocale.split('-')[0]) {
    return 1;
  }
  return -1;
}
