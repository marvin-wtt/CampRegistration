import type { Identifiable } from './Identifiable.js';

export interface CampManager extends Identifiable {
  name: string | null;
  email: string;
  role: string;
  status: string;
  expiresAt: string | null;
}

export interface CampManagerCreateData {
  email: string;
  role: string;
  expiresAt?: string | undefined;
}

export interface CampManagerUpdateData {
  role?: string | undefined;
  expiresAt?: string | null | undefined;
}
