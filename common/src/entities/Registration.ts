import { Identifiable } from './Identifiable.js';
import { Timestamps } from './Timestamps.js';
import { Translatable } from './Translatable.js';

export interface Registration extends Identifiable, Timestamps {
  data: Record<string, unknown>;
  computedData: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    emails: string[] | null;
    role: string | null;
    gender: string | null;
    address: {
      street: string | null;
      city: string | null;
      zipCode: string | null;
      country: string | null;
    };
  };
  customData: Record<string, unknown>;
  waitingList: boolean;
  locale: string;
  room?: Translatable | null;
  files?: Record<string, string>;
}

export type RegistrationCreateData = Pick<Registration, 'data'> &
  Pick<Partial<Registration>, 'locale'>;

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'customData' | 'waitingList'>
>;

export interface RegistrationUpdateQuery {
  supressMessage?: boolean | undefined;
}
export interface RegistrationDeleteQuery {
  supressMessage?: boolean | undefined;
}
