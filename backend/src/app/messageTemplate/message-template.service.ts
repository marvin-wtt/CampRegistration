import prisma from '#client.js';
import type { Prisma } from '@prisma/client';
import Handlebars from 'handlebars';

class MessageTemplateService {
  async getMessageTemplateById(campId: string, id: string) {
    return prisma.messageTemplate.findFirst({
      where: {
        id,
        campId,
      },
      include: {
        attachments: true,
      },
    });
  }

  async queryMessageTemplates(campId: string) {
    return prisma.messageTemplate.findMany({
      where: { campId },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateByName(event: string, campId: string) {
    return prisma.messageTemplate.findFirst({
      where: {
        campId,
        event,
      },
      include: {
        attachments: true,
      },
    });
  }

  async createTemplate(
    campId: string,
    data: Omit<Prisma.MessageTemplateCreateInput, 'camp'>,
  ) {
    return prisma.messageTemplate.create({
      data: {
        campId,
        ...data,
      },
      include: {
        attachments: true,
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
      include: {
        attachments: true,
      },
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

  createSubjectCompiler(template: string): (context: unknown) => string {
    return Handlebars.compile(template, {
      knownHelpersOnly: true,
      knownHelpers: {
        if: true,
        unless: true,
        each: true,
        with: true,
      },
      noEscape: true, // No escape needed for subjects
    });
  }

  createBodyCompiler(template: string): (context: unknown) => string {
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
    const compile = this.createBodyCompiler(template);

    return compile(context);
  }
}

export default new MessageTemplateService();
