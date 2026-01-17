import type { Prisma } from '@prisma/client';
import Handlebars from 'handlebars';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class MessageTemplateService extends BaseService {
  async getMessageTemplateById(campId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
        campId,
      },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateWithCamp(id: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id,
      },
      include: {
        camp: { select: { id: true } },
        attachments: true,
      },
    });
  }

  async queryMessageTemplates(campId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { campId },
      include: {
        attachments: true,
      },
    });
  }

  async getMessageTemplateByName(event: string, campId: string) {
    return this.prisma.messageTemplate.findFirst({
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
    return this.prisma.messageTemplate.create({
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
    return this.prisma.messageTemplate.update({
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
    return this.prisma.messageTemplate.delete({
      where: {
        id,
        campId,
      },
    });
  }

  createSubjectCompiler(template: string): (context: unknown) => string {
    template = template.trim();

    // Remove paragraph tags if they are present
    if (template.startsWith('<p>') && template.endsWith('</p>')) {
      template = template.slice(3, -4).trim();
    }

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
