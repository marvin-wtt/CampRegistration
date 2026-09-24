import { Identifiable } from './Identifiable.js';
import { ServiceFile } from './ServiceFile.js';

export interface MessageDelivery extends Identifiable {
  to: string | null;
  cc: string | null;
  bcc: string | null;
  replyTo: string | null;
  subject: string;
  body: string;
  priority: string;
  createdAt: string;
  attachments: ServiceFile[] | null;
  bouncedAt: string | null;
  bounceReason: string | null;
  // Where the email came from: a manual message (`messageId`, sent by
  // `sentBy`) or an automated template (`trigger`). Null once that source is
  // deleted — the delivery itself outlives it.
  messageId: string | null;
  trigger: string | null;
  sentBy: { id: string; name: string | null } | null;
}
