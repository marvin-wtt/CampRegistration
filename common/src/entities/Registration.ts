import { Identifiable } from './Identifiable';
import { Timestamps } from './Timestamps';

export interface Registration extends Identifiable, Timestamps {
  data: Record<string, unknown>;
  campData: Record<string, unknown[]>;
  waitingList: boolean;
  locale: string;
  room?: Record<string, string>;
  files?: Record<string, string>;
}

export type RegistrationCreateData = unknown;

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'waitingList'>
>;
