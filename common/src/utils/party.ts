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
