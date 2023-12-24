import type { Identifiable } from './Identifiable';

export interface Bed extends Identifiable {
  registrationId: string | null;
}
