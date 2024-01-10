import type {
  TableTemplate,
  TemplateCreateData,
  TemplateUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useTemplateService() {
  async function fetchResultTemplates(
    campId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/`);

    return response.data?.data;
  }

  async function fetchResultTemplate(
    campId: string,
    templateId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/${templateId}/`);

    return response.data?.data;
  }

  async function createResultTemplate(
    campId: string,
    data: TemplateCreateData,
  ): Promise<TableTemplate> {
    const response = await api.post(`camps/${campId}/templates/`, data);

    return response.data?.data;
  }

  async function updateResultTemplate(
    campId: string,
    templateId: string,
    data: TemplateUpdateData,
  ): Promise<TableTemplate> {
    const response = await api.put(
      `camps/${campId}/templates/${templateId}/`,
      data,
    );

    return response.data?.data;
  }

  async function deleteResultTemplate(
    campId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/templates/${templateId}/`);
  }

  return {
    fetchResultTemplates,
    fetchResultTemplate,
    createResultTemplate,
    updateResultTemplate,
    deleteResultTemplate,
  };
}
