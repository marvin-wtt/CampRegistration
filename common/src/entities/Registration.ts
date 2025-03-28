import { Identifiable } from './Identifiable.js';
import { Timestamps } from './Timestamps.js';
import { Translatable } from './Translatable.js';

export interface Registration extends Identifiable, Timestamps {
  data: Record<string, unknown>;
  campData: Record<string, unknown[]>;
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
