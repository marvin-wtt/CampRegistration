import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

export interface Message extends Identifiable {
  replyTo: string | null;
  subject: string;
  body: string;
  priority: string;
  createdAt: string;
  attachments: ServiceFile[] | null;
}

export interface MessageCreateData {
  registrations: string[];
  replyTo?: string | string[];
  subject: string;
  body: string;
  priority?: string;
  attachments?: string[];
}
