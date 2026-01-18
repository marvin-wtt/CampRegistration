import type { Prisma } from '@prisma/client';
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
}
