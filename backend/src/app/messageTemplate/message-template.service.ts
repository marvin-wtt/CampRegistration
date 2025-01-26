import prisma from '#client.js';

class MessageTemplateService {
  async getMessageTemplateById(id: string, campId: string) {
    return prisma.messageTemplate.findFirstOrThrow({
      where: {
        id,
        campId,
      },
    });
  }

  async getMessageTemplateByName(name: string, campId: string) {
    return prisma.messageTemplate.findFirstOrThrow({
      where: {
        name,
        campId,
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
}

export default new MessageTemplateService();
