import type { Identifiable } from './Identifiable.js';

export interface NewsletterSubscriber extends Identifiable {
  email: string;
  name: string | null;
  subscribedAt: string;
}

export interface NewsletterSubscriberCreateData {
  email: string;
  name?: string | null;
  /** Attests that the person agreed to receive this newsletter. */
  consentConfirmed: boolean;
}

export interface NewsletterSubscriberImportData {
  campId: string;
  country?: string | null;
  requireConsent?: boolean;
  /** Attests consent for the imported people; required unless `requireConsent` is set. */
  consentConfirmed?: boolean;
}
