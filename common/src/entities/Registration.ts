import { Identifiable } from './Identifiable.js';
import { Timestamps } from './Timestamps.js';
import { Translatable } from './Translatable.js';

export interface Registration extends Identifiable, Timestamps {
  data: Record<string, unknown>;
  computedData: {
    firstName: string | null;
    lastName: string | null;
    dataOfBirth: string | null;
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
  waitingList: boolean;
  locale: string;
  room?: Translatable | null;
  files?: Record<string, string>;
}

export type RegistrationCreateData = Pick<Registration, 'data'> &
  Pick<Partial<Registration>, 'locale'>;

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'waitingList'>
>;
