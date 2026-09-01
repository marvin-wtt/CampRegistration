import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

export interface MessageRecipient {
  registrationId: string;
  to: string | null;
}

export interface Message extends Identifiable {
  subject: string;
  body: string;
  replyTo: string | null;
  priority: string;
  attachments: ServiceFile[] | null;
  recipients?: MessageRecipient[] | undefined;
  sentBy: { id: string; name: string | null } | null;
  createdAt: string | null;
}

export interface MessageCreateData {
  registrationIds: string[];
  replyTo?: string | string[] | undefined;
  subject: string;
  body: string;
  priority?: string | undefined;
  attachmentIds?: string[] | undefined;
}
