import type { SurveyModel } from 'survey-core';

export interface FileEntry {
  id: string;
  field: string | null;
  locale: string | null;
}

/**
 * Selects the best-matching file per field for a given locale.
 * Priority: exact locale match > language prefix match > default (null locale).
 * Files that don't match at all are excluded.
 */
export function selectFilesByLocale<T extends FileEntry>(
  files: T[],
  locale: string,
): Record<string, T> {
  const result: Partial<Record<string, T>> = {};

  for (const file of files) {
    if (!file.field) {
      continue;
    }

    const score = localeScore(file.locale, locale);
    if (score < 0) {
      continue;
    }

    const current = result[file.field];
    if (!current || score > localeScore(current.locale, locale)) {
      result[file.field] = file;
    }
  }

  return result as Record<string, T>;
}

export function setFileVariables(
  model: SurveyModel,
  files: FileEntry[],
  locale: string,
  getUrl: (id: string) => string,
): void {
  const selected = selectFilesByLocale(files, locale);
  const fileVars: Record<string, string> = {};
  for (const [field, file] of Object.entries(selected)) {
    fileVars[field] = getUrl(file.id);
  }
  model.setVariable('_file', fileVars);
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
