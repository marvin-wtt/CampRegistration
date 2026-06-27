import type { Message, File } from '#generated/prisma/client.js';
import type {
  Message as MessageData,
  MessageRecipient,
} from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import { JsonResource } from '#core/resource/JsonResource';

interface RecipientDelivery {
  registrationId: string | null;
  to: string | null;
}

export interface MessageWithFiles extends Message {
  attachments: File[];
  // Present when the ad-hoc message is loaded with its deliveries.
  deliveries?: RecipientDelivery[];
}

export class MessageResource extends JsonResource<
  MessageWithFiles,
  MessageData
> {
  transform(): MessageData {
    return {
      id: this.data.id,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      replyTo: this.data.replyTo ?? null,
      attachments: FileResource.collection(this.data.attachments).transform(),
      recipients: this.mapRecipients(this.data.deliveries ?? []),
      createdAt: this.data.createdAt.toISOString(),
    };
  }

  /**
   * Collapses per-email delivery rows into one recipient per registration,
   * dropping rows that are no longer linked to a registration.
   */
  private mapRecipients(deliveries: RecipientDelivery[]): MessageRecipient[] {
    const byRegistration = new Map<string, MessageRecipient>();
    for (const delivery of deliveries) {
      if (delivery.registrationId === null) {
        continue;
      }
      if (!byRegistration.has(delivery.registrationId)) {
        byRegistration.set(delivery.registrationId, {
          registrationId: delivery.registrationId,
          to: delivery.to,
        });
      }
    }
    return [...byRegistration.values()];
  }
}
