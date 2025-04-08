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
  registrationIds: string[];
  replyTo?: string | string[] | undefined;
  subject: string;
  body: string;
  priority?: string | undefined;
  attachments?: string[] | undefined;
}
