import type { Identifiable } from './Identifiable.js';
import type { NewsletterManagerRole } from '../permissions/roles.js';

export interface NewsletterManager extends Identifiable {
  name: string | null;
  email: string;
  role: NewsletterManagerRole;
}

export interface NewsletterManagerCreateData {
  email: string;
  role?: NewsletterManagerRole;
}
