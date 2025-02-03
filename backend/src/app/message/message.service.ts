import prisma from '#client.js';
import type { Prisma, Camp, Message, Registration } from '@prisma/client';
import messageTemplateService from '#app/messageTemplate/message-template.service.js';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';
import mailService from '#app/mail/mail.service.js';

type MessageCreateInput = Pick<
  Prisma.MessageCreateInput,
  'subject' | 'body' | 'priority' | 'replyTo'
>;

interface RecipientCreateData {
  messageId: string;
  registrationId: string;
  email: string;
  subject: string;
  body: string;
}

class MessageService {
  async createMessage(data: MessageCreateInput) {
    return prisma.message.create({
      data,
    });
  }

  async queryRecipients(messageId: string) {
    return prisma.messageReceipient.findMany({
      where: { messageId },
    });
  }

  async createManyRecipients(data: RecipientCreateData[]) {
    await prisma.messageReceipient.createMany({
      data,
    });
  }

  async sendMessageToRegistrations(
    camp: Camp,
    registrations: Registration | Registration[],
    message: Message,
  ) {
    registrations = Array.isArray(registrations)
      ? registrations
      : [registrations];

    // Create compiler
    const subjectCompiler = messageTemplateService.createCompiler(
      message.subject,
    );
    const bodyCompiler = messageTemplateService.createCompiler(message.body);
    // Compiler context
    const globalContext = {
      camp,
    };

    // Create recipients
    const recipientData = registrations.flatMap((registration) => {
      // Compile text
      const context = {
        ...globalContext,
        registration,
      };

      const subject = subjectCompiler(context);
      const body = bodyCompiler(context);

      // Extract emails
      const helper = new RegistrationCampDataHelper(registration.campData);
      const emails = helper.emails();

      // Map fields
      return emails.map((email) => ({
        messageId: message.id,
        registrationId: registration.id,
        subject,
        body,
        email,
      }));
    });

    await this.createManyRecipients(recipientData);

    // Fetch all created recipients
    const recipients = await this.queryRecipients(message.id);

    await mailService.sendAll(message, recipients);
  }
}

export default new MessageService();
