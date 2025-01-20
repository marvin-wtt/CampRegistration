import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

export interface Message extends Identifiable {
  recipients: string;
  replyTo: string;
  subject: string;
  body: string;
  priority: string;
  sentAt: string | null;
  createdAt: string;
  attachments: ServiceFile[] | null;
}

export interface MessageCreateData {
  registrations: string[];
  replyTo: string | string[];
  subject: string;
  body: string;
  priority?: string;
  attachments?: string[];
}

export interface MessageUpdateData {}
