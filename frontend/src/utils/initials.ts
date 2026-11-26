/** First and last name's initials, e.g. "Anna Maria Weber" → "AW"; one name → one letter. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';

  return (first + last).toUpperCase();
}
