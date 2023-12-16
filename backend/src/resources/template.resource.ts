import { Template } from '@prisma/client';

type TemplateInput = Pick<Template, 'id' | 'data'>;

const templateResource = (template: TemplateInput) => {
  const data = typeof template.data === 'object' ? template.data : {};

  return {
    ...data,
    id: template.id,
  };
};

export default templateResource;
