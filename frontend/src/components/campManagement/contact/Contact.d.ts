import type { Registration } from '@camp-registration/common/dist/node/entities';

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

interface PlainContact {
  type: 'external';
  name: string;
  email: string;
}

export type Contact = PlainContact | GroupContact | RegistrationContact;
