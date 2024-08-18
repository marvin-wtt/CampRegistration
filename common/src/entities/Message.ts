import type { Identifiable } from './Identifiable';
import { ServiceFile } from './ServiceFile';

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

export type MessageUpdateData = {};
