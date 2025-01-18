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
  role?: string;
  expiresAt?: string;
}

export interface CampManagerUpdateData {
  role?: string;
  expiresAt?: string | null;
}
