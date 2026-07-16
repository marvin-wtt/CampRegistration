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
}
