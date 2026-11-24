// Case and accents don't matter: "jose" finds "José".
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Whether every word of the query is in one of the fields. */
export function matchesText(
  query: string | null | undefined,
  fields: readonly (string | null | undefined)[],
): boolean {
  const words = fold(query ?? '')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const haystack = fields.filter(Boolean).map((f) => fold(f!));
  return words.every((word) => haystack.some((field) => field.includes(word)));
}
