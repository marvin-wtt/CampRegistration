import type { AddressLike } from '#app/mail/mail.types.js';

export function addressLikeToString(to: AddressLike): string {
  const items = Array.isArray(to) ? to : [to];
  return items
    .map((entry) => (typeof entry === 'string' ? entry : entry.address))
    .join(', ');
}
