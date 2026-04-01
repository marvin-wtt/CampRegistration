import type { Identifiable } from './Identifiable.js';

export type RegistrationLogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface RegistrationLog extends Identifiable {
  registrationId: string;
  campId: string;
  action: RegistrationLogAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}
