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
  status: 'PENDING' | 'WAITLISTED' | 'ACCEPTED';
  locale: string;
  room?: Translatable | null;
  /**
   * Manager-provided file slots (custom table columns of type file), keyed by
   * slot name. Form files live inside `data` instead.
   */
  customFiles?: Record<string, string>;
}

export type RegistrationCreateData = Pick<Registration, 'data'> & {
  locale?: string | null;
};

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'customData' | 'status'>
> & {
  /**
   * Custom file slots: maps a slot name to a file id to attach or `null` to
   * remove the slot's file. Only the mentioned slots are changed. The current
   * assignments are returned in `Registration.customFiles`.
   */
  customFiles?: Record<string, string | null>;
};

export interface RegistrationUpdateQuery {
  suppressMessage?: boolean | undefined;
}
export interface RegistrationDeleteQuery {
  suppressMessage?: boolean | undefined;
}
