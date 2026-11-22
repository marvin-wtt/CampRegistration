/**
 * Every kind of space as one no-break space. Engines ship different locale
 * data, and the versions disagree mostly on which space a format uses (a plain
 * one, U+00A0 or U+202F). Formatted values pass through this, so browser and
 * server render the same text — the consent wording is compared exactly.
 */
export function uniformSpaces(text: string): string {
  return text.replace(/\p{Zs}/gu, ' ');
}
