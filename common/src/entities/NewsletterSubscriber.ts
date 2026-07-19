import type { Identifiable } from './Identifiable.js';

export interface NewsletterSubscriber extends Identifiable {
  email: string;
  name: string | null;
  subscribedAt: string;
}

export interface NewsletterSubscriberCreateData {
  email: string;
  name?: string | null;
}

export interface NewsletterSubscriberImportData {
  campId: string;
  country?: string | null;
  requireConsent?: boolean;
}
