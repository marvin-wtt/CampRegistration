import type { Identifiable } from './Identifiable.js';

export interface NewsletterManager extends Identifiable {
  name: string | null;
  email: string;
}

export interface NewsletterManagerCreateData {
  email: string;
}
