import { BaseService } from '#core/base/BaseService';

export class TableTemplateService extends BaseService {
  async getTemplateById(campId: string, id: string) {
    return this.prisma.tableTemplate.findFirst({
      where: { id, campId },
    });
  }

  async queryTemplates(campId: string) {
    return this.prisma.tableTemplate.findMany({
      where: { campId },
    });
  }

  async createTemplate(campId: string, data: Record<string, unknown>) {
    return this.prisma.tableTemplate.create({
      data: {
        data,
        campId,
      },
    });
  }

  async createManyTemplates(
    campId: string,
    templates: Record<string, unknown>[],
  ) {
    const data = templates.map((template) => {
      return {
        data: template,
        campId,
      };
    });

    return this.prisma.tableTemplate.createMany({
      data,
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

export default new TableTemplateService();
