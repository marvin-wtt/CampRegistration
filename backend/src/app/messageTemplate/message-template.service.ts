import prisma from '#client.js';
import type { MessageTemplate, Prisma } from '@prisma/client';

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
}

export default new MessageTemplateService();
