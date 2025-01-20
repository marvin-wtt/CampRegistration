import { Message, File } from '@prisma/client';
import type { Message as MessageResource } from '@camp-registration/common/entities';
import fileResource from '#app/file/file.resource.js';

interface MessageWithRelations extends Message {
  attachments: {
    file: File;
  }[];
}

const messageResource = (message: MessageWithRelations): MessageResource => {
  const attachments =
    message.attachments
      ?.map((attachment) => attachment.file)
      .map(fileResource) ?? null;
  const sentAt = message.sentAt?.toISOString() ?? null;

  return {
    id: message.id,
    recipients: message.recipients,
    replyTo: message.replyTo,
    subject: message.subject,
    body: message.body,
    priority: message.priority,
    sentAt,
    createdAt: message.createdAt.toISOString(),
    attachments,
  };
};

export default messageResource;
