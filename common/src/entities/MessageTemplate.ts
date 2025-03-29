import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';
import { Translatable } from './Translatable.js';

export interface MessageTemplateQuery {
  includeDefaults?: boolean | undefined;
  hasEvent?: boolean | undefined;
}

export interface MessageTemplate extends Identifiable<string | null> {
  event: string | null;
  subject: Translatable;
  body: Translatable;
  replyTo: string | null;
  priority: string;
  attachments: ServiceFile[] | null;
  updatedAt: string | null;
  createdAt: string | null;
}

export interface MessageTemplateCreateData {
  event: string;
  subject: Translatable;
  body: Translatable;
  priority?: string | undefined;
  attachments?: File[] | string[] | undefined;
}

export interface MessageTemplateUpdateData {
  subject?: Translatable | undefined;
  body?: Translatable | undefined;
  priority?: string | undefined | null;
  attachments?: File[] | string[] | undefined | null;
}
