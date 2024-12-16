import type { Identifiable } from './Identifiable.js';

export interface Bed extends Identifiable {
  registrationId: string | null;
}
