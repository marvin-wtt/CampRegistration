import prisma from '../client';
import { ulid } from '../utils/ulid';
import { MessageTemplate } from '@prisma/client';
import dlv from 'dlv';
import { notificationService } from 'services';
import { Attachment } from 'nodemailer/lib/mailer';
import logger from '../config/logger';

type MessageContext = Record<string, string | object>;

type MessageFileType = Attachment;

interface MessageData {
  recipients: string | string[];
  subject: string;
  body: string;
  context: MessageContext;
  replyTo: string;
  priority?: string;
  attachments?: MessageFileType[];
  locale?: string;
  registrationId?: string;
}

const sendMessage = async (data: MessageData) => {
  const body = compileMessageBody(data.body, data.context);
  const recipients = Array.isArray(data.recipients)
    ? data.recipients.join(';')
    : data.recipients;

  // Link message to registration
  const registrations = data.registrationId
    ? { create: { registrationId: data.registrationId } }
    : undefined;

  const message = await prisma.message.create({
    data: {
      id: ulid(),
      replyTo: data.replyTo,
      subject: data.subject,
      recipients,
      body,
      priority: data.priority,
      registrations,
    },
  });

  try {
    await notificationService.sendEmail({
      to: message.recipients,
      replyTo: message.replyTo,
      subject: message.subject,
      template: 'message',
      context: {
        body: message.body,
      },
    });

    return prisma.message.update({
      data: {
        sentAt: new Date(),
      },
      where: {
        id: message.id,
      },
    });
  } catch (reason) {
    logger.warn('Failed to send message: ' + reason);
    // TODO add job that sends emails again later
  }

  return message;
};

/**
 * Searches the message template with name for a camp.
 * If the template was not found and a locale was specified, a template with
 * the provided name and any locale for the camp will be returned.
 *
 *
 * @param campId The camp id of the template
 * @param name The name of the template
 * @param locale The locale, if there are multiple locales present
 * @return The template or null, if no matching template was found
 */
const getMessageTemplate = async (
  campId: string,
  name: string,
  locale?: string,
) => {
  const template = await prisma.messageTemplate.findFirst({
    where: {
      name,
      campId,
      locale,
    },
  });

  if (template || !locale) {
    return template;
  }

  return prisma.messageTemplate.findFirst({
    where: {
      name,
      campId,
    },
  });
};

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const sendMessageWithTemplate = async (
  template: MessageTemplate,
  data: WithOptional<MessageData, 'body' | 'subject' | 'priority'>,
) => {
  return sendMessage({
    body: template.body,
    subject: template.subject,
    priority: template.priority,
    ...data,
  });
};

const compileMessageBody = (
  body: string,
  tokens: MessageContext,
  locale?: string,
): string => {
  return body.replace(/{{\s*(.*?)\s*}}/g, (match, path) => {
    const value = dlv(tokens, path, path);

    if (value === path || typeof value !== 'object') {
      return value;
    }

    // Check if the object is a translation
    if (locale && locale in value && typeof value.locale === 'string') {
      return value[locale];
    }

    return value;
  });
};

export default {
  getMessageTemplate,
  sendMessageWithTemplate,
};
