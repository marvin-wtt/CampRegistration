import type { Identifiable } from './Identifiable.js';

export type NewsletterSubscriberStatus = 'pending' | 'confirmed';

export interface NewsletterSubscriber extends Identifiable {
  email: string;
  name: string | null;
  status: NewsletterSubscriberStatus;
  subscribedAt: string;
  consentedAt: string;
  confirmedAt: string | null;
  confirmationSentAt: string | null;
}

export interface NewsletterSubscriberCreateData {
  email: string;
  name?: string | null;
  consentConfirmed: boolean;
  /** When the person agreed; defaults to now. */
  consentedAt?: string;
}

export interface NewsletterSubscriberImportData {
  eventId: string;
  group?: string | null;
}

export interface NewsletterSubscriberImportResult {
  added: number;
  skipped: number;
}

/** What the public confirmation page shows before the person confirms. */
export interface NewsletterConfirmation {
  newsletterName: string;
  organizationName: string;
  confirmed: boolean;
}
