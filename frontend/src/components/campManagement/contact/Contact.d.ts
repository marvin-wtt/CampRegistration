import { Registration } from '@camp-registration/common/dist/node/entities';

interface GroupContact {
  type: 'group';
  name: string;
  registrations: Registration[];
}

interface IndividualContact {
  type: 'participant' | 'counselor';
  name: string;
  registration: Registration;
}

interface PlainContact {
  type: 'external' | 'manager';
  name: string;
  email: string;
}

export type Contact = PlainContact | GroupContact | IndividualContact;
