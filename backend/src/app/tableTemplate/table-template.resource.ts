import { TableTemplate } from '@prisma/client';

type TableTemplateInput = Pick<TableTemplate, 'id' | 'data'>;

const tableTemplateResource = (template: TableTemplateInput) => {
  const data = typeof template.data === 'object' ? template.data : {};

  return {
    ...data,
    id: template.id,
  };
};

export default tableTemplateResource;
