/**
 * Who paid or receives: an account, else a free-text name. Records name the
 * same party when their keys match; `null` is nobody (event funds).
 */
export function partyKey(
  userId: string | null | undefined,
  name: string | null | undefined,
): string | null {
  if (userId) {
    return `user:${userId}`;
  }
  return name ? `name:${name}` : null;
}

export const payerKey = (e: {
  paidByUserId: string | null;
  paidByName: string | null;
}) => partyKey(e.paidByUserId, e.paidByName);

export const recipientKey = (p: {
  recipientUserId: string | null;
  recipientName: string | null;
}) => partyKey(p.recipientUserId, p.recipientName);

/** A typed name as stored: trimmed, with single spaces. */
export function normalizePartyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * A typed name as compared against the known ones: case and spacing don't
 * make another person, so "anna " is the "Anna" already there. Not
 * locale-aware, so client and server agree.
 */
export function partyNameKey(name: string): string {
  return normalizePartyName(name).toLowerCase();
}

/**
 * Of known spellings that are one person, the one a new record joins. By
 * code unit, not locale, so client and server pick the same: "Tomasz" before
 * "tomasz".
 */
export function pickSpelling<T extends string>(
  spellings: readonly T[],
): T | undefined {
  return [...spellings].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
}
