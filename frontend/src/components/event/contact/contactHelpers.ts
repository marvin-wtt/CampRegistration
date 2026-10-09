import type {
  Message,
  MessageRecipient,
  Registration,
} from '@camp-registration/common/entities';
import type { Contact } from '@/components/event/contact/Contact';

export function contactRegistrations(contact: Contact): Registration[] {
  return contact.type === 'group'
    ? contact.registrations
    : [contact.registration];
}

/** Each registration once, however the selected contacts overlap. */
export function uniqueRegistrations(contacts: Contact[]): Registration[] {
  const byId = new Map<string, Registration>();
  for (const contact of contacts) {
    for (const registration of contactRegistrations(contact)) {
      byId.set(registration.id, registration);
    }
  }
  return [...byId.values()];
}

/** Recipients with at least one address the message bounced from. */
export function undeliveredRecipients(message: Message): MessageRecipient[] {
  return (message.recipients ?? []).filter((recipient) =>
    recipient.deliveries.some((delivery) => delivery.bouncedAt),
  );
}
