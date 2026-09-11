interface LocalizedFile {
  locale: string | null;
}

/**
 * Selects the single best-matching file for a given locale from a list of
 * candidates (e.g. all files for one field/slot).
 * Priority: exact locale match > language prefix match > default (null locale).
 * Returns undefined when no candidate matches at all.
 */
export function selectFileByLocale<T extends LocalizedFile>(
  files: T[],
  locale: string,
): T | undefined {
  let best: T | undefined;
  let bestScore = -1;

  for (const file of files) {
    const score = localeScore(file.locale, locale);
    if (score > bestScore) {
      best = file;
      bestScore = score;
    }
  }

  return bestScore < 0 ? undefined : best;
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

/**
 * Reserved slot for an event's logo. Unlike the slots a form declares through
 * {_file.<slot>}, this one exists whether or not the form mentions it: it is
 * the event's brand image, surfaced by the API as `Event.logo` and rendered on
 * event cards, in the event layout and in link previews.
 */
export const EVENT_LOGO_SLOT = 'logo';
