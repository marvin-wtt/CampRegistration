import type { Identifiable } from './Identifiable.js';

export interface NewsletterSubscriber extends Identifiable {
  email: string;
  name: string | null;
  subscribedAt: string;
}

export interface NewsletterSubscriberCreateData {
  email: string;
  name?: string | null;
  consentConfirmed: boolean;
}

export interface NewsletterSubscriberImportData {
  eventId: string;
  country?: string | null;
  requireConsent?: boolean;
  consentConfirmed?: boolean;
}
