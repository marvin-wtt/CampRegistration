import type { Identifiable } from './Identifiable.js';

export type EventManagerRole =
  'DIRECTOR' | 'COORDINATOR' | 'COUNSELOR' | 'VIEWER';

export type EventManagerStatus = 'ACCEPTED' | 'PENDING';

export interface EventManagerIdentity extends Identifiable {
  name: string | null;
  email: string;
}

export interface EventManager extends EventManagerIdentity {
  role: EventManagerRole;
  status: EventManagerStatus;
  expiresAt: string | null;
}

export interface EventManagerCreateData {
  email: string;
  role: EventManagerRole;
  expiresAt?: string | undefined;
}

export interface EventManagerUpdateData {
  role?: EventManagerRole | undefined;
  expiresAt?: string | null | undefined;
}
