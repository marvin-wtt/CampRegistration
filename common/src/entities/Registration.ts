import { Identifiable } from './Identifiable';

export interface Registration extends Identifiable {
  data: Record<string, unknown>;
  campData: Record<string, unknown[]>;
  waitingList: boolean;
  locale: string;
  room?: Record<string, string>;
  created_at: string;
  updated_at: string | null;
}

export type RegistrationCreateData = unknown;

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'waitingList'>
>;
