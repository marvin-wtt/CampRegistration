import type { Identifiable } from './Identifiable.js';

export interface Newsletter extends Identifiable {
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface NewsletterCreateData {
  name: string;
  description?: string | null;
}

export interface NewsletterUpdateData {
  name?: string;
  description?: string | null;
}

export interface NewsletterSendData {
  subject: string;
  body: string;
}

export interface NewsLetterQuery {
  view?: 'all' | 'assigned';
}

export interface NewsletterMessage {
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentAt: string;
}
