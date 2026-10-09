import type {
  Registration,
  ServiceFile,
} from '@camp-registration/common/dist/node/entities';

interface GroupContact {
  type: 'group';
  name: string;
  registrations: Registration[];
  /** One country's share of the group; `null` for those without one. */
  country?: string | null;
}

interface RegistrationContact {
  type: 'participant' | 'counselor' | 'waitingList' | 'pending';
  name: string;
  registration: Registration;
}

export type Contact = GroupContact | RegistrationContact;

/**
 * Content loaded into the composer: a sent message reused as a template, or a
 * restored draft. Without `recipients` the composer starts with an empty
 * recipient list so the user chooses who to send to.
 */
export interface ContactDraft {
  recipients?: Contact[];
  subject: string;
  body: string;
  priority: 'high' | 'normal' | 'low';
  replyTo: string | null;
  attachments: ServiceFile[];
}
