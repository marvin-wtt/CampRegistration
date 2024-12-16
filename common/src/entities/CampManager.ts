import type { Identifiable } from './Identifiable.js';

export interface CampManager extends Identifiable {
  name: string | null;
  email: string;
  role: string;
  status: string;
}

export interface CampManagerCreateData {
  email: string;
  role?: string;
}

export type CampManagerUpdateData = Partial<CampManagerCreateData>;
