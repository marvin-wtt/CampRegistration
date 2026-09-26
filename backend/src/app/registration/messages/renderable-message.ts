import type {
  Event,
  File,
  Message,
  MessageTemplate,
} from '#generated/prisma/client.js';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container';

export type MessageTemplateWithFiles = MessageTemplate & {
  attachments: File[];
};

// The unified shape the render pipeline consumes, satisfied by both an ad-hoc
// Message and an automated MessageTemplate.
export interface RenderableMessage {
  kind: 'message' | 'template';
  id: string;
  subject: string;
  body: string;
  priority: string;
  replyTo: string | null;
  attachments: File[];
}

export function templateToRenderable(
  template: MessageTemplateWithFiles,
): RenderableMessage {
  return {
    kind: 'template',
    id: template.id,
    subject: template.subject,
    body: template.body,
    priority: template.priority,
    replyTo: template.replyTo,
    attachments: template.attachments,
  };
}

type MessageWithFiles = Message & { attachments: File[] };

// Adapts an ad-hoc Message into the shared RenderableMessage contract, mirroring
// templateToRenderable so both send paths build the shape in exactly one place.
export function messageToRenderable(
  message: MessageWithFiles,
): RenderableMessage {
  return {
    kind: 'message',
    id: message.id,
    subject: message.subject,
    body: message.body,
    priority: message.priority,
    replyTo: message.replyTo,
    attachments: message.attachments,
  };
}

export async function loadMessageTemplate(
  event: Event,
  trigger: string,
  country: string | null | undefined,
): Promise<MessageTemplateWithFiles | null> {
  try {
    const messageTemplateService = resolve(MessageTemplateService);

    // When the event has only one group, we can assume the person is in that group
    if (country === null && event.countries.length === 1) {
      country = event.countries[0];
    }

    return await messageTemplateService.getMessageTemplateByName(
      event.id,
      trigger,
      country,
    );
  } catch (error) {
    logger.error(error);
    return null;
  }
}
