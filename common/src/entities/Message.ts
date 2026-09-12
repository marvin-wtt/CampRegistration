import type { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

// One per email the message was actually sent to. A registration can have
// several emails, and each is delivered (and can bounce) independently.
export interface MessageRecipientDelivery {
  to: string | null;
  bouncedAt: string | null;
  bounceReason: string | null;
}

export interface MessageRecipient {
  registrationId: string;
  deliveries: MessageRecipientDelivery[];
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
