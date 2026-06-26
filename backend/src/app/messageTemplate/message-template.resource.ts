import { JsonResource } from '#core/resource/JsonResource';
import type { MessageTemplate, File } from '#generated/prisma/client.js';
import type {
  MessageTemplate as MessageTemplateData,
  MessageTemplateRecipient,
} from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';

interface RecipientMessage {
  registrationId: string | null;
  to: string | null;
}

export interface MessageTemplateWithFiles extends MessageTemplate {
  attachments: File[];
  // Present for ad-hoc templates (event === null) to expose recipients.
  messages?: RecipientMessage[];
}

export class MessageTemplateResource extends JsonResource<
  MessageTemplateWithFiles,
  MessageTemplateData
> {
  transform(): MessageTemplateData {
    return {
      id: this.data.id,
      country: this.data.country ?? null,
      event: this.data.event ?? null,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      replyTo: this.data.replyTo ?? null,
      attachments: FileResource.collection(this.data.attachments).transform(),
      // Ad-hoc templates (no event) always carry their recipients.
      ...(this.data.event === null
        ? { recipients: this.mapRecipients(this.data.messages ?? []) }
        : {}),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }

  /**
   * Collapses per-email message rows into one recipient per registration,
   * dropping rows that are no longer linked to a registration.
   */
  private mapRecipients(
    messages: RecipientMessage[],
  ): MessageTemplateRecipient[] {
    const byRegistration = new Map<string, MessageTemplateRecipient>();
    for (const message of messages) {
      if (message.registrationId === null) {
        continue;
      }
      if (!byRegistration.has(message.registrationId)) {
        byRegistration.set(message.registrationId, {
          registrationId: message.registrationId,
          to: message.to,
        });
      }
    }
    return [...byRegistration.values()];
  }
}
