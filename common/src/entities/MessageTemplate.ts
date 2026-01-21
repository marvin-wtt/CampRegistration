import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';
import { Translatable } from './Translatable.js';

export interface MessageTemplateQuery {
  includeDefaults?: boolean | undefined;
  hasEvent?: boolean | undefined;
}

export interface MessageTemplate extends Identifiable {
  event: string | null;
  country: string | null;
  subject: string;
  body: string;
  replyTo: string | null;
  priority: string;
  attachments: ServiceFile[] | null;
  updatedAt: string | null;
  createdAt: string | null;
}

export interface MessageTemplateCreateData {
  event: string;
  country: string | null;
  subject: Translatable;
  body: Translatable;
  priority?: string | undefined;
  attachmentIds?: string[] | undefined;
}

export interface MessageTemplateUpdateData {
  subject?: Translatable | undefined;
  body?: Translatable | undefined;
  priority?: string | undefined | null;
  attachmentIds?: string[] | undefined | null;
}
