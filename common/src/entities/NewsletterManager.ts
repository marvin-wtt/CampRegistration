import type { Identifiable } from './Identifiable.js';

export type NewsletterManagerRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NewsletterManager extends Identifiable {
  name: string | null;
  email: string;
  role: NewsletterManagerRole;
}

export interface NewsletterManagerCreateData {
  email: string;
  role?: NewsletterManagerRole;
}
