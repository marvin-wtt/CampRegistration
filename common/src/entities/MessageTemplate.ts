import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

export interface MessageTemplate extends Identifiable {
  name: string;
  subject: string;
  body: string;
  priority: string;
  attachments: ServiceFile[] | null;
}

export interface MessageTemplateCreateData {
  subject: string;
  body: string;
  priority?: string | undefined;
}

export interface MessageTemplateUpdateData {
  subject?: string | undefined;
  body?: string | undefined;
  priority?: string | undefined | null;
}
