import prisma from '#client.js';
import type { MessageTemplate, Prisma } from '@prisma/client';
import * as handlebars from 'handlebars';

class MessageTemplateService {
  async getMessageTemplateById(id: string, campId: string) {
    return prisma.messageTemplate.findFirstOrThrow({
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

  async getMessageTemplateByName(name: string, campId: string) {
    return prisma.messageTemplate.findFirst({
      where: {
        name,
        campId,
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
    return handlebars.compile(template, {
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
