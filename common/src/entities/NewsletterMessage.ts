import type { Identifiable } from './Identifiable.js';

export interface NewsletterMessage extends Identifiable {
  subject: string;
  body: string;
  recipientCount: number;
  sentAt: string;
  sentBy: { id: string; name: string | null } | null;
}

export interface NewsletterMessageCreateData {
  subject: string;
  body: string;
  attachmentIds?: string[];
}
