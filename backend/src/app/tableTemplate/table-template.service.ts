import prisma from '#client.js';

class TableTemplateService {
  async getTemplateById(campId: string, id: string) {
    return prisma.tableTemplate.findFirst({
      where: { id, campId },
    });
  }

  async queryTemplates(campId: string) {
    return prisma.tableTemplate.findMany({
      where: { campId },
    });
  }

  async createTemplate(campId: string, data: Record<string, unknown>) {
    return prisma.tableTemplate.create({
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

    return prisma.tableTemplate.createMany({
      data,
    });
  }

  async updateTemplateById(templateId: string, data: Record<string, unknown>) {
    return prisma.tableTemplate.update({
      where: { id: templateId },
      data: {
        data,
      },
    });
  }

  async deleteTemplateById(templateId: string) {
    await prisma.tableTemplate.delete({ where: { id: templateId } });
  }
}

export default new TableTemplateService();
