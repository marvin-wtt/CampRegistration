import type { AddressLike } from '#core/mail/mail.types';

export function addressLikeToString(to: AddressLike): string {
  const items = Array.isArray(to) ? to : [to];
  return items
    .map((entry) => (typeof entry === 'string' ? entry : entry.address))
    .join(', ');
}
