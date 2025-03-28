import prisma from '#client.js';
import type { MessageTemplate, Prisma } from '@prisma/client';
import Handlebars from 'handlebars';

class MessageTemplateService {
  async getMessageTemplateById(campId: string, id: string) {
    return prisma.messageTemplate.findFirst({
      where: {
        id,
        campId,
      },
    });
  }

  async queryMessageTemplates(campId: string) {
    return prisma.messageTemplate.findMany({
      where: { campId },
    });
  }

  async getMessageTemplateByName(event: string, campId: string) {
    return prisma.messageTemplate.findFirst({
      where: {
        campId,
        event,
      },
    });
  }

  async createTemplate(
    campId: string,
    data: Omit<Prisma.MessageTemplateCreateInput, 'camp'>,
  ): Promise<MessageTemplate> {
    return prisma.messageTemplate.create({
      data: {
        campId,
        ...data,
      },
    });
  }

  async updateMessageTemplate(
    id: string,
    campId: string,
    data: Prisma.MessageTemplateUpdateInput,
  ) {
    return prisma.messageTemplate.update({
      where: {
        id,
        campId,
      },
      data,
    });
  }

  async deleteMessageTemplateById(id: string, campId: string) {
    return prisma.messageTemplate.delete({
      where: {
        id,
        campId,
      },
    });
  }

  createCompiler(template: string): (context: unknown) => string {
    return Handlebars.compile(template, {
      knownHelpersOnly: true,
      knownHelpers: {
        if: true,
        unless: true,
        each: true,
        with: true,
      },
    });
  }

  compileText(template: string, context: object) {
    const compile = this.createCompiler(template);

    return compile(context);
  }
}

export default new MessageTemplateService();
