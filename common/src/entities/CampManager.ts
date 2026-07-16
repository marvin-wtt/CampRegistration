import type { Identifiable } from './Identifiable.js';

export type CampManagerRole =
  'DIRECTOR' | 'COORDINATOR' | 'COUNSELOR' | 'VIEWER';

export type CampManagerStatus = 'ACCEPTED' | 'PENDING';

export interface CampManager extends Identifiable {
  name: string | null;
  email: string;
  role: CampManagerRole;
  status: CampManagerStatus;
  expiresAt: string | null;
}

export interface CampManagerCreateData {
  email: string;
  role: CampManagerRole;
  expiresAt?: string | undefined;
}

export interface CampManagerUpdateData {
  role?: CampManagerRole | undefined;
  expiresAt?: string | null | undefined;
}
