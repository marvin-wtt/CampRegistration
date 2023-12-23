import type { Identifiable } from './Identifiable';

export interface CampManager extends Identifiable {
  name?: string;
  email: string;
  role: string;
  status: string;
}

export type CampManagerCreateData = Pick<CampManager, 'role'>;

export type CampManagerUpdateData = Partial<CampManagerCreateData>;
