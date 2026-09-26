import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class TableTemplateService extends BaseService {
  async getTemplateById(eventId: string, id: string) {
    return this.prisma.tableTemplate.findFirst({
      where: { id, eventId },
    });
  }

  async queryTemplates(eventId: string) {
    return this.prisma.tableTemplate.findMany({
      where: { eventId },
    });
  }

  async createTemplate(eventId: string, data: Record<string, unknown>) {
    return this.prisma.tableTemplate.create({
      data: {
        data,
        eventId,
      },
    });
  }

  async updateTemplateById(templateId: string, data: Record<string, unknown>) {
    return this.prisma.tableTemplate.update({
      where: { id: templateId },
      data: {
        data,
      },
    });
  }

  async deleteTemplateById(templateId: string) {
    await this.prisma.tableTemplate.delete({ where: { id: templateId } });
  }
}
