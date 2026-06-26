import type {
  Registration,
  ServiceFile,
} from '@camp-registration/common/dist/node/entities';

interface GroupContact {
  type: 'group';
  name: string;
  registrations: Registration[];
}

interface RegistrationContact {
  type: 'participant' | 'counselor' | 'waitingList';
  name: string;
  registration: Registration;
}

export type Contact = GroupContact | RegistrationContact;

/**
 * Message content loaded into the composer when resending a sent message.
 * Recipients are intentionally excluded — resending starts with an empty
 * recipient list so the user chooses who to send to.
 */
export interface ContactDraft {
  subject: string;
  body: string;
  priority: 'high' | 'normal' | 'low';
  replyTo: string | null;
  attachments: ServiceFile[];
}
