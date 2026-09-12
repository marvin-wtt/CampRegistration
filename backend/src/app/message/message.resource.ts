import type { Message, File, User } from '#generated/prisma/client.js';
import type {
  Message as MessageData,
  MessageRecipient,
} from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import { JsonResource } from '#core/resource/JsonResource';

interface RecipientDelivery {
  registrationId: string;
  to: string | null;
  bouncedAt: Date | null;
  bounceReason: string | null;
}

export interface MessageWithFiles extends Message {
  attachments: File[];
  sentBy?: Pick<User, 'id' | 'name'> | null;
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
      sentBy: this.data.sentBy
        ? { id: this.data.sentBy.id, name: this.data.sentBy.name }
        : null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }

  /**
   * Groups per-email delivery rows by registration. A registration with
   * multiple emails gets one delivery row each, kept separate (not
   * collapsed) so the UI can show exactly which address bounced rather than
   * just "something for this registration bounced".
   */
  private mapRecipients(deliveries: RecipientDelivery[]): MessageRecipient[] {
    const byRegistration = new Map<string, MessageRecipient['deliveries']>();
    for (const delivery of deliveries) {
      const list = byRegistration.get(delivery.registrationId) ?? [];
      list.push({
        to: delivery.to,
        bouncedAt: delivery.bouncedAt?.toISOString() ?? null,
        bounceReason: delivery.bounceReason,
      });
      byRegistration.set(delivery.registrationId, list);
    }
    return [...byRegistration.entries()].map(
      ([registrationId, registrationDeliveries]) => ({
        registrationId,
        deliveries: registrationDeliveries,
      }),
    );
  }
}
